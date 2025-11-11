import os, time, zlib, hashlib, json
from typing import Dict, Tuple, Optional

# ---------------- L1 In-process cache -------------------------------
_L1_CACHE: Dict[str, Tuple[float, str]] = {}
_L1_DEFAULT_TTL = int(os.getenv("L1_CACHE_TTL", 300))  # seconds

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

# ---------------- Shared cache-key helper ---------------------------
def make_cache_key(text: str, src: str, tgt: str, lvl: str) -> str:
    """Stable SHA-256 cache-key for a translation request."""
    payload = {"text": text, "src": src, "tgt": tgt, "lvl": lvl}
    return "translation:" + hashlib.sha256(
        json.dumps(payload, sort_keys=True).encode()
    ).hexdigest()