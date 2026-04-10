"""Shared translation logic used by both views and Celery tasks.

This module contains all LLM interaction code so that neither views.py
nor tasks.py duplicate the translation loop, prompt building, or chunk
splitting logic.
"""

import os
import re
import time

import httpx

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = os.getenv("TRANSLATION_MODEL", "nvidia/nemotron-3-super-120b-a12b:free")

SYSTEM_PROMPT = (
    "You are a professional translator. Reply ONLY with the translated text. "
    "Do not add ANY explanations, analysis, thinking, reasoning, titles, "
    "or extra text. Do not include phrases like 'The translation is:' or "
    "'Here is the translation:'. Output ONLY the translated text."
)

MAX_CHARS_PER_REQUEST = 1500  # safety margin vs LLM context length

LEVEL_CONFIGS = {
    "A1": {
        "temperature": 0.2,
        "top_p": 0.7,
        "style": "very simple German (A1): basic words, short sentences.",
    },
    "A2": {
        "temperature": 0.4,
        "top_p": 0.8,
        "style": "simple German (A2): basic grammar/common words, everyday phrases.",
    },
    "B1": {
        "temperature": 0.6,
        "top_p": 0.9,
        "style": "everyday German (B1): natural conversations/work/travel.",
    },
    "B2": {
        "temperature": 0.8,
        "top_p": 0.95,
        "style": "advanced fluent German (B2): native-like, idiomatic.",
    },
}


def _build_prompt(text: str, src: str, tgt: str, level: str = "") -> str:
    """Return a concise translation prompt for the LLM."""
    if tgt == "de" and level:
        config = LEVEL_CONFIGS.get(level, {})
        style = config.get("style", f"({level})")
        return (
            f"Source: {src}\nTarget: {tgt}\nLevel: {style}\n"
            f"Text: {text}\n"
            f"Translation:"
        )
    return f"Source: {src}\nTarget: {tgt}\n" f"Text: {text}\n" f"Translation:"


def _split_into_chunks(text: str, max_chars: int = MAX_CHARS_PER_REQUEST):
    """Split long input on sentence boundaries to keep each chunk within max_chars."""
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks, current = [], ""
    for s in sentences:
        if len(current) + len(s) + 1 > max_chars:
            if current:
                chunks.append(current.strip())
                current = ""
        current += s + " "
    if current.strip():
        chunks.append(current.strip())
    return chunks


def _get_api_key() -> str:
    """Return the OpenRouter API key or raise an error if missing."""
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        raise RuntimeError(
            "OPENROUTER_API_KEY is not set. "
            "Add it to your .env or Render environment variables."
        )
    return key


def _build_payload(chunk: str, level: str, tgt_lang: str) -> dict:
    """Build the OpenRouter request payload for a single chunk."""
    if tgt_lang == "de" and level:
        config = LEVEL_CONFIGS.get(level) or {"temperature": 0.5, "top_p": 0.9}
    else:
        config = {"temperature": 0.5, "top_p": 0.9}
    return {
        "model": MODEL,
        "max_tokens": max(60, int(len(chunk.split()) * 4)),
        "temperature": config["temperature"],
        "top_p": config["top_p"],
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": chunk},
        ],
    }


def translate_chunk_sync(
    client: httpx.Client, chunk: str, level: str, tgt_lang: str
) -> str:
    """Translate a single chunk synchronously with retry logic."""
    headers = {
        "Authorization": f"Bearer {_get_api_key()}",
        "Content-Type": "application/json",
    }
    payload = _build_payload(chunk, level, tgt_lang)
    retries = 0
    backoff = 2
    while True:
        try:
            llm_resp = client.post(OPENROUTER_URL, json=payload, headers=headers)
            if llm_resp.status_code == 429 and retries < 3:
                retries += 1
                ra = llm_resp.headers.get("Retry-After")
                try:
                    wait = int(ra) if ra else backoff
                except Exception:
                    wait = backoff
                time.sleep(wait)
                backoff = min(backoff * 2, 30)
                continue
            llm_resp.raise_for_status()
            data = llm_resp.json()
            raw = data["choices"][0]["message"]["content"].strip()
            # Strip chain-of-thought / reasoning blocks if present
            # Some models output <thinking>...</thinking> or "Reasoning:" blocks
            # Keep only the final translated text
            cleaned = _strip_reasoning(raw)
            return cleaned
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429 and retries < 3:
                retries += 1
                ra = e.response.headers.get("Retry-After")
                try:
                    wait = int(ra) if ra else backoff
                except Exception:
                    wait = backoff
                time.sleep(wait)
                backoff = min(backoff * 2, 30)
                continue
            if e.response.status_code == 429:
                raise RuntimeError(
                    "Upstream rate limit still exceeded. Please try later."
                ) from e
            raise RuntimeError(f"Upstream translation error: {e}") from e
        except (KeyError, IndexError) as e:
            raise RuntimeError(f"Unexpected LLM response format: {e}") from e
        except httpx.RequestError:
            raise RuntimeError(
                "Upstream translation service unavailable. Please try later."
            )


def _strip_reasoning(text: str) -> str:
    """Remove chain-of-thought / reasoning blocks from LLM output.

    Some models emit internal reasoning before the actual answer.
    We strip known patterns to return only the final translation.
    """
    # Remove XML-style reasoning/thinking blocks
    text = re.sub(r"<[^>]+>.*?</[^>]+>", "", text, flags=re.DOTALL).strip()

    # Remove markdown code blocks
    text = re.sub(r"```.*?```", "", text, flags=re.DOTALL).strip()

    # Split into paragraphs - reasoning is usually the first paragraph(s)
    paragraphs = text.split("\n\n")

    # If there are multiple paragraphs, the translation is likely the last one
    # (reasoning comes first, translation last)
    if len(paragraphs) > 2:
        # Check if first paragraphs contain reasoning markers
        reasoning_in_first = any(
            m in paragraphs[0].lower()
            for m in [
                "we need to",
                "i need to",
                "the user says",
                "they want",
                "they didn't",
                "the text",
                "translate from",
                "let me",
                "first,",
                "to translate",
                "probably",
            ]
        )
        if reasoning_in_first:
            # Take the last paragraph as the actual translation
            text = paragraphs[-1].strip()

    # Remove trailing analysis/notes
    trailing_markers = [
        "\n\nthe translation",
        "\n\nnote:",
        "\n\nexplanation:",
        "\n\nthis translation",
        "\n\nin this",
        "\n\nthe above",
        "\n---\n",
        "\n\n---\n\n",
    ]
    for marker in trailing_markers:
        idx = text.lower().find(marker)
        if idx != -1:
            text = text[:idx].strip()
            break

    return text.strip()
