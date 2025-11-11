import os, json, hashlib, asyncio
import httpx
from asgiref.sync import sync_to_async
from django.core.cache import cache
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse
import csv
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Translation, UserLoginLog
from .serializers import (
    TranslationSerializer,
    RegisterSerializer,
    UserLoginLogSerializer,
)
from .permissions import IsOwner

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemma-3-27b-it:free"

# --- Prompt helpers (leaner prompts & optional chunking) --------------------
SYSTEM_PROMPT = "You are a professional translator. Reply ONLY with the translated text."

MAX_CHARS_PER_REQUEST = 1500  # safety margin vs LLM context length

def _build_prompt(text: str, src: str, tgt: str, level: str = "") -> str:
    """Return a concise translation prompt for the LLM."""
    if tgt == "de" and level:
        return (
            f"Translate the following text from {src} to German ({level}).\\n\\n" + text
        )
    return f"Translate from {src} to {tgt}:\\n\\n" + text


def _split_into_chunks(text: str, max_chars: int = MAX_CHARS_PER_REQUEST):
    """Split long input on sentence boundaries to keep each chunk within max_chars."""
    import re

    sentences = re.split(r"(?<=[.!?])\\s+", text)
    chunks, current = [], ""
    for s in sentences:
        # +1 for space/newline between sentences
        if len(current) + len(s) + 1 > max_chars:
            if current:
                chunks.append(current.strip())
                current = ""
        current += s + " "
    if current.strip():
        chunks.append(current.strip())
    return chunks

class TranslateView(APIView):
    """Translate input text to German at a given CEFR level.

    - GET: Public, returns a short help message so the browsable API doesn’t 401.
    - POST: Requires authentication, performs the translation.
    """

    def get_permissions(self):
        # Allow unauthenticated GET/OPTIONS so the DRF UI can render,
        # but require auth for POST.
        if self.request.method in ("GET", "OPTIONS"):
            return []  # = AllowAny
        return [permissions.IsAuthenticated()]

    def get(self, request):
        return Response(
            {
                "message": "Send a POST with {input_text, level} and Bearer token to receive a translation.",
                "allowed_levels": ["A1", "A2", "B1", "B2"],
            }
        )

    async def post(self, request):
        text = request.data.get("input_text", "").strip()
        source_lang = request.data.get("source_lang", "en")
        target_lang = request.data.get("target_lang", "de")
        level = request.data.get("level", "")  # optional now

        # Validate languages
        allowed_langs = [code for code, _ in Translation.LANG_CHOICES]
        if source_lang not in allowed_langs or target_lang not in allowed_langs:
            return Response({"error": "Invalid language code"}, status=400)

        # If translating INTO German, level must be provided and valid
        if target_lang == "de":
            if level not in ["A1", "A2", "B1", "B2"]:
                return Response({"error": "Invalid or missing CEFR level"}, status=400)
        else:
            # For other target languages, ignore level
            level = ""

        # Build a cache key and try cache first (fast, avoids DB + LLM hit)
        import hashlib, json
        cache_key_payload = {
            "text": text,
            "src": source_lang,
            "tgt": target_lang,
            "lvl": level,
        }
        cache_key = "translation:" + hashlib.sha256(json.dumps(cache_key_payload, sort_keys=True).encode()).hexdigest()
        cached_translation = cache.get(cache_key)
        if cached_translation:
            return Response({"translation": cached_translation}, status=200)

        # Attempt to reuse recent identical translation in DB before calling LLM
        existing = (
            Translation.objects.filter(
                input_text=text,
                source_lang=source_lang,
                target_lang=target_lang,
                level=level,
            )
            .order_by("-created_at")
            .first()
        )
        if existing:
            # backfill cache for next time
            cache.set(cache_key, existing.output_text, int(os.getenv("CACHE_TTL", 3600)))
            return Response({"translation": existing.output_text}, status=200)

        headers = {
            "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
            "Content-Type": "application/json",
        }

        # ---------------- Translation loop over chunks ----------------
        src_lang_name = dict(Translation.LANG_CHOICES).get(source_lang)
        tgt_lang_name = dict(Translation.LANG_CHOICES).get(target_lang)
        chunks = _split_into_chunks(text)
        translations_accum = []

        for chunk in chunks:
            prompt = _build_prompt(chunk, src_lang_name, tgt_lang_name, level)
            payload = {
                "model": MODEL,
                "max_tokens": int(len(chunk.split()) * 2),  # loose upper-bound
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
            }

            retries = 0
            backoff = 2  # seconds
            async with httpx.AsyncClient(timeout=30) as client:
                while True:
                    try:
                        llm_resp = await client.post(OPENROUTER_URL, json=payload, headers=headers)
                        if llm_resp.status_code == 429 and retries < 3:
                            retries += 1
                            await asyncio.sleep(backoff)
                            backoff *= 2
                            continue
                        llm_resp.raise_for_status()
                        break
                    except httpx.HTTPStatusError as e:
                        if e.response.status_code == 429 and retries < 3:
                            retries += 1
                            await asyncio.sleep(backoff)
                            backoff *= 2
                            continue
                        if e.response.status_code == 429:
                            return Response({"error": "Upstream rate limit still exceeded. Please try later."}, status=429)
                        return Response({"error": str(e)}, status=e.response.status_code)
                    except httpx.RequestError:
                        return Response({"error": "Upstream translation service unavailable. Please try later."}, status=503)

            translated_chunk = llm_resp.json()["choices"][0]["message"]["content"].strip()
            translations_accum.append(translated_chunk)

        translation = "\n".join(translations_accum)

        # Persist and cache
        Translation.objects.create(
            user=request.user,
            input_text=text,
            output_text=translation,
            level=level,
            source_lang=source_lang,
            target_lang=target_lang,
        )
        cache.set(cache_key, translation, int(os.getenv("CACHE_TTL", 3600)))
        return Response({"translation": translation}, status=201)

class HistoryListView(generics.ListAPIView):
    serializer_class = TranslationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Translation.objects.filter(user=self.request.user)


class RegisterView(generics.CreateAPIView):
    """Allow anyone to create a new user account."""

    queryset = get_user_model().objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginLogListView(generics.ListAPIView):
    """Return recent login attempts for the current user."""

    serializer_class = UserLoginLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserLoginLog.objects.filter(user=self.request.user)


class ExportHistoryView(APIView):
    """Export the authenticated user's translation history as a CSV file."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        translations = Translation.objects.filter(user=request.user).order_by("-created_at")
        # Create the HttpResponse object with CSV headers
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="translation_history.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "Date",
            "Source Language",
            "Target Language",
            "Level",
            "Input Text",
            "Output Text",
        ])
        for t in translations:
            writer.writerow([
                t.created_at.isoformat(sep=" ", timespec="seconds"),
                t.source_lang,
                t.target_lang,
                t.level or "-",
                t.input_text.replace("\n", " "),
                t.output_text.replace("\n", " "),
            ])
        return response