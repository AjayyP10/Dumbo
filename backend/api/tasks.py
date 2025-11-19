import asyncio
import os

import httpx
from celery import shared_task
from django.contrib.auth import get_user_model
from django.core.cache import cache

from .cache_utils import _compress, _l1_set, chunk_get, chunk_set
from .models import Translation
from .translation_engine import (
    LEVEL_CONFIGS,
    MODEL,
    OPENROUTER_URL,
    SYSTEM_PROMPT,
    _build_prompt,
    _get_api_key,
    _split_into_chunks,
)


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def translate_text_task(
    self,
    user_id: int,
    text: str,
    source_lang: str,
    target_lang: str,
    level: str,
    cache_key: str,
):
    """
    Heavy-weight translation task executed in Celery worker.
    Returns the final translation string (also cached & persisted).
    """
    src_name = dict(Translation.LANG_CHOICES).get(source_lang)
    tgt_name = dict(Translation.LANG_CHOICES).get(target_lang)
    chunks = _split_into_chunks(text)
    translations = []

    headers = {
        "Authorization": f"Bearer {_get_api_key()}",
        "Content-Type": "application/json",
    }
    limits = httpx.Limits(
        max_connections=int(os.getenv("HTTPX_MAX_CONNECTIONS", 20)),
        max_keepalive_connections=int(os.getenv("HTTPX_MAX_KEEPALIVE", 10)),
    )

    async def _translate_chunk(client: httpx.AsyncClient, chunk: str) -> str:
        prompt = _build_prompt(chunk, src_name, tgt_name, level)
        if tgt_name == "de" and level:
            config = LEVEL_CONFIGS.get(level, {"temperature": 0.5, "top_p": 0.9})
        else:
            config = {"temperature": 0.5, "top_p": 0.9}
        payload = {
            "model": MODEL,
            "max_tokens": max(60, int(len(chunk.split()) * 4)),
            "temperature": config["temperature"],
            "top_p": config["top_p"],
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        }
        resp = await client.post(OPENROUTER_URL, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()

    async def _run_async():
        async with httpx.AsyncClient(timeout=30, limits=limits) as client:
            sem = asyncio.Semaphore(int(os.getenv("PARALLEL_CHUNK_LIMIT", 5)))
            tasks = []
            for chunk in chunks:
                cached = chunk_get(chunk, source_lang, target_lang, level)
                if cached:
                    translations.append(cached)
                    continue
                tasks.append(_translate_chunk_with_sem(client, chunk, sem))
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in results:
                if isinstance(r, Exception):
                    raise r
                translations.append(r)
        return "\n".join(translations)

    async def _translate_chunk_with_sem(client, chunk, sem):
        async with sem:
            translated = await _translate_chunk(client, chunk)
            chunk_set(chunk, source_lang, target_lang, level, translated)
            return translated

    loop = asyncio.new_event_loop()
    try:
        asyncio.set_event_loop(loop)
        translation = loop.run_until_complete(_run_async())
    finally:
        loop.close()

    # Persist
    user = get_user_model().objects.filter(id=user_id).first()
    Translation.objects.create(
        user=user,
        input_text=text,
        output_text=translation,
        level=level,
        source_lang=source_lang,
        target_lang=target_lang,
    )

    # Cache (L2 & L1)
    compressed = _compress(translation)
    cache.add(cache_key, compressed, int(os.getenv("CACHE_TTL", 3600)))
    _l1_set(cache_key, translation)
    return translation
