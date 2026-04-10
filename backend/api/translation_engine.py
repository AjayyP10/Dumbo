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
    "You are a professional translator. Output ONLY the translated text. "
    "Never explain, analyze, think out loud, or provide alternatives. "
    "Just output the raw translated text."
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

# Common German words used to identify German text in mixed outputs
GERMAN_MARKERS = [
    "gehen",
    "zum",
    "und",
    "ich",
    "das",
    "der",
    "die",
    "ist",
    "haben",
    "werden",
    "konnen",
    "mussen",
    "sollen",
    "wollen",
    "mogen",
    "durfen",
    "nicht",
    "auch",
    "noch",
    "aber",
    "denn",
    "weil",
    "dass",
    "wenn",
    "hallo",
    "guten",
    "bitte",
    "danke",
    "ja",
    "nein",
    "deutsch",
    "klasse",
    "kurs",
    "unterricht",
    "lass",
    "uns",
]


def _is_german(text_snippet: str) -> bool:
    """Check if text looks like German translation."""
    if not text_snippet or len(text_snippet) < 3:
        return False
    lower = text_snippet.lower()
    # Has German-specific characters
    if any(c in text_snippet for c in "äöüß"):
        return True
    # Contains German words
    return any(marker in lower for marker in GERMAN_MARKERS)


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
    payload = {
        "model": MODEL,
        "max_tokens": max(60, int(len(chunk.split()) * 4)),
        "temperature": config["temperature"],
        "top_p": config["top_p"],
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": chunk},
        ],
    }
    # Enable reasoning for models that support it (e.g., Gemma)
    if "gemma" in MODEL.lower():
        payload["reasoning"] = {"enabled": True}
    return payload


def _strip_reasoning(text: str) -> str:
    """Remove chain-of-thought / reasoning blocks from LLM output.

    Aggressively extracts only the actual translation text.
    """
    if not text:
        return text

    try:
        # Strategy 1: Find all double-quoted text, pick the German one
        all_quotes = re.findall(r'"([^"\n]{5,})"', text)
        german_quotes = [q for q in all_quotes if _is_german(q)]

        if german_quotes:
            # Return the longest German quote (usually the main translation)
            return max(german_quotes, key=len).strip()

        # Strategy 2: Look for "Provide translation:" or similar indicators
        for indicator in [
            "provide translation:",
            "translation:",
            "german:",
            "deutsch:",
        ]:
            idx = text.lower().find(indicator)
            if idx != -1:
                after = text[idx + len(indicator) :].strip()
                quotes_after = re.findall(r'"([^"\n]{5,})"', after)
                for q in quotes_after:
                    if _is_german(q):
                        return q.strip()
                # If no quotes, take first sentence
                first_sent = re.split(r"[.!?\n]", after)[0].strip()
                if first_sent and len(first_sent) > 5:
                    return first_sent

        # Strategy 3: If text starts with reasoning, find German text anywhere
        reasoning_starters = [
            "we need to",
            "the user",
            "they want",
            "let me",
            "i need to",
            "first,",
            "to translate",
            "the source text",
            "the sentence",
            "the text",
            "the phrase",
        ]
        if any(text.lower().startswith(s) for s in reasoning_starters):
            if german_quotes:
                return german_quotes[0].strip()
            # Find any substantial German text
            sentences = re.split(r"[.!?\n]+", text)
            for sent in reversed(sentences):
                sent = sent.strip().strip("\"' ")
                if len(sent) > 10 and _is_german(sent):
                    return sent

        # Strategy 4: Fallback - if text is short, return as-is
        if len(text) < 150:
            return text.strip()

        # Strategy 5: Take the last sentence that looks like German
        sentences = [
            s.strip().strip("\"' ") for s in re.split(r"[.!?\n]+", text) if s.strip()
        ]
        for sent in reversed(sentences):
            if len(sent) > 5 and _is_german(sent):
                return sent

        return text.strip()
    except Exception:
        # Never crash - fallback to original text
        return text.strip() if text else text


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
