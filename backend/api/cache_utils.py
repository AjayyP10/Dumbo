import hashlib
import json
import os
import time
import zlib
from typing import Dict, Optional, Tuple

# ---------------- L1 In-process cache -------------------------------
# Added simple per-chunk sub-cache so long texts sharing chunks reuse results
_L1_CACHE: Dict[str, Tuple[float, str]] = {}
_CHUNK_CACHE: Dict[str, Tuple[float, str]] = {}  # key = sha256(chunk)
_L1_DEFAULT_TTL = int(os.getenv("L1_CACHE_TTL", 300))  # seconds
_CHUNK_TTL = int(os.getenv("CHUNK_CACHE_TTL", 3600))


def _l1_get(key: str) -> Optional[str]:
    entry = _L1_CACHE.get(key)
    if not entry:
        return None
    expires_at, value = entry
    if expires_at is None or expires_at > time.time():
        return value
    # expired
    _L1_CACHE.pop(key, None)
    return None


def _l1_set(key: str, value: str, ttl: int = _L1_DEFAULT_TTL) -> None:
    _L1_CACHE[key] = (time.time() + ttl, value)


def _l1_delete(key: str) -> None:
    _L1_CACHE.pop(key, None)


# ---------------- Compression helpers for Redis (L2) ----------------
def _compress(value: str) -> bytes:
    return zlib.compress(value.encode("utf-8"))


def _decompress(blob: bytes) -> str:
    try:
        return zlib.decompress(blob).decode("utf-8")
    except zlib.error:
        # Already plain string bytes
        return blob.decode("utf-8")


# ---------------- Per-chunk helpers ---------------------------


def _make_chunk_key(chunk: str, src: str, tgt: str, lvl: str) -> str:
    payload = {"chunk": chunk, "src": src, "tgt": tgt, "lvl": lvl}
    return (
        "chunk:"
        + hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
    )


def chunk_get(chunk: str, src: str, tgt: str, lvl: str):
    key = _make_chunk_key(chunk, src, tgt, lvl)
    # Try L1
    entry = _CHUNK_CACHE.get(key)
    if entry and entry[0] > time.time():
        return entry[1]
    # Try Redis L2
    from django.core.cache import cache

    blob = cache.get(key)
    if isinstance(blob, (bytes, bytearray)):
        val = _decompress(blob)
    else:
        val = blob
    if val:
        _CHUNK_CACHE[key] = (time.time() + _CHUNK_TTL, val)
    return val


def chunk_set(chunk: str, src: str, tgt: str, lvl: str, translation: str):
    key = _make_chunk_key(chunk, src, tgt, lvl)
    from django.core.cache import cache

    _CHUNK_CACHE[key] = (time.time() + _CHUNK_TTL, translation)
    cache.add(key, _compress(translation), _CHUNK_TTL)


# ---------------- Shared cache-key helper ---------------------------
def make_cache_key(text: str, src: str, tgt: str, lvl: str) -> str:
    """Stable SHA-256 cache-key for a translation request."""
    payload = {"text": text, "src": src, "tgt": tgt, "lvl": lvl}
    return (
        "translation:"
        + hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
    )
