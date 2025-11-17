import os
import time

import httpx
import csv
from celery.result import AsyncResult
from django.contrib.auth import get_user_model
from django.http import HttpResponse, HttpResponseRedirect
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from django.core.cache import cache
from rest_framework import generics, permissions
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Translation, UserLoginLog
from .serializers import (
    RegisterSerializer,
    TranslationSerializer,
    UserLoginLogSerializer,
)

# Import shared caching helpers
from .cache_utils import (
    _compress,
    _decompress,
    _l1_get,
    _l1_set,
    chunk_get,
    chunk_set,
    make_cache_key,
)


# Custom auth class to allow CSRF-exempt session-based requests (e.g., /api/logout/)

class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return  # Skip CSRF; view stays @csrf_exempt


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemma-3-27b-it:free"

# --- Prompt helpers (leaner prompts & optional chunking) --------------------
SYSTEM_PROMPT = (
    "You are a professional translator. Reply ONLY with the translated text."
)

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

    def get(self, request, *args, **kwargs):
        """Synchronous GET handler (DRF browsable API help)."""
        return Response(
            {
                "message": (
                    "Send a POST with {input_text, level} and Bearer token "
                    "to receive a translation."
                ),
                "allowed_levels": ["A1", "A2", "B1", "B2"],
            }
        )

    def post(self, request):
        """Synchronous POST handler.

        We reverted from async → sync because older DRF/Django versions raise
        `TypeError: object Response can't be used in 'await' expression` when
        an async view is wrapped by the default CSRF decorator. Using a
        standard sync view avoids this incompatibility and still allows us to
        off-load long-running work to Celery.
        """
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
        cache_key = make_cache_key(text, source_lang, target_lang, level)

        # --- Optionally offload long or explicitly async requests to Celery ---
        if request.query_params.get("async") == "1" or len(text) > int(
            os.getenv("ASYNC_TRANSLATE_THRESHOLD", 3000)
        ):
            from .tasks import translate_text_task

            task = translate_text_task.delay(
                user_id=request.user.id,
                text=text,
                source_lang=source_lang,
                target_lang=target_lang,
                level=level,
                cache_key=cache_key,
            )
            return Response({"task_id": task.id, "status": "queued"}, status=202)
        # ------------- Level-1 (in-process) cache check ------------
        cached_translation = _l1_get(cache_key)
        if cached_translation:
            return Response({"translation": cached_translation}, status=200)

        # ------------- Level-2 (Redis/django-redis) check ------------
        redis_blob = cache.get(cache_key)
        if isinstance(redis_blob, (bytes, bytearray)):
            cached_translation = _decompress(redis_blob)
        else:
            cached_translation = redis_blob
        if cached_translation:
            # Populate L1 for faster subsequent access within process
            _l1_set(cache_key, cached_translation)
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
            cache.set(
                cache_key, existing.output_text, int(os.getenv("CACHE_TTL", 3600))
            )
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

        limits = httpx.Limits(
            max_connections=int(os.getenv("HTTPX_MAX_CONNECTIONS", 20)),
            max_keepalive_connections=int(os.getenv("HTTPX_MAX_KEEPALIVE", 10)),
        )
        with httpx.Client(timeout=30, limits=limits) as client:
            for chunk in chunks:
                cached_chunk = chunk_get(chunk, source_lang, target_lang, level)
                if cached_chunk:
                    translations_accum.append(cached_chunk)
                    continue
                prompt = _build_prompt(chunk, src_lang_name, tgt_lang_name, level)
                payload = {
                    "model": MODEL,
                    "max_tokens": max(60, int(len(chunk.split()) * 4)),
                    "temperature": 0,
                    "top_p": 0.1,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                }

                retries = 0
                backoff = 2
                while True:
                    try:
                        llm_resp = client.post(
                            OPENROUTER_URL, json=payload, headers=headers
                        )
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
                        break
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
                            return Response(
                                {
                                    "error": (
                                        "Upstream rate limit still exceeded. "
                                        "Please try later."
                                    )
                                },
                                status=429,
                            )
                        return Response(
                            {"error": str(e)}, status=e.response.status_code
                        )
                    except httpx.RequestError:
                        return Response(
                            {
                                "error": (
                                    "Upstream translation service unavailable. "
                                    "Please try later."
                                )
                            },
                            status=503,
                        )

                translated_chunk = llm_resp.json()["choices"][0]["message"][
                    "content"
                ].strip()
                chunk_set(chunk, source_lang, target_lang, level, translated_chunk)
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

        # Cache stampede protection via add() (SETNX) so only first writer stores
        compressed = _compress(translation)
        cache.add(cache_key, compressed, int(os.getenv("CACHE_TTL", 3600)))
        _l1_set(cache_key, translation)
        return Response({"translation": translation}, status=201)


class UserProfileView(APIView):
    """GET current user's profile; PATCH display_name once."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "profile", None)
        if not profile:
            return Response({"display_name": None})
        from .serializers import UserProfileSerializer

        return Response(UserProfileSerializer(profile).data)

    def patch(self, request):
        profile = getattr(request.user, "profile", None)
        if not profile:
            # Create a profile on-the-fly if it does not exist (e.g., legacy user)
            from .models import UserProfile

            profile = UserProfile.objects.create(user=request.user)
        if profile.display_name:
            return Response({"error": "Username already set"}, status=400)
        from .serializers import UserProfileSerializer

        ser = UserProfileSerializer(profile, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)


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
        translations = Translation.objects.filter(user=request.user).order_by(
            "-created_at"
        )
        # Create the HttpResponse object with CSV headers
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = (
            'attachment; filename="translation_history.csv"'
        )

        writer = csv.writer(response)
        writer.writerow(
            [
                "Date",
                "Source Language",
                "Target Language",
                "Level",
                "Input Text",
                "Output Text",
            ]
        )
        for t in translations:
            writer.writerow(
                [
                    t.created_at.isoformat(sep=" ", timespec="seconds"),
                    t.source_lang,
                    t.target_lang,
                    t.level or "-",
                    t.input_text.replace("\n", " "),
                    t.output_text.replace("\n", " "),
                ]
            )
        return response


class GoogleAuthComplete(APIView):
    """Custom view that is called after Google OAuth completes.

    Expects the user to be authenticated in the session by social-auth-app-django.
    Issues a pair of JWT tokens so the SPA can authenticate subsequent requests.
    """

    authentication_classes = [SessionAuthentication]
    # We will perform a redirect instead of JSON, so no renderer needed
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response({"error": "Authentication failed"}, status=401)

        refresh = RefreshToken.for_user(request.user)
        # Include the user's email in both refresh & access tokens so the SPA can
        # greet the user without an extra API call.
        email = request.user.email or request.user.get_username()
        refresh["email"] = email
        refresh.access_token["email"] = email

        # Build redirect URL to frontend, embedding tokens in URL fragment so
        # they are never sent to the server via HTTP referer or logs.
        frontend_base = os.getenv("FRONTEND_URL", "http://localhost:5173")
        redirect_url = (
            f"{frontend_base}/oauth-complete#access={str(refresh.access_token)}"
            f"&refresh={str(refresh)}"
        )
        return HttpResponseRedirect(redirect_url)


@method_decorator(csrf_exempt, name="dispatch")
class LogoutView(APIView):
    """Log out the current session (clears Django session cookies).

    This endpoint allows the SPA to ensure the server-side session created by
    social-auth is terminated when the user logs out or before switching
    accounts. It is intentionally CSRF-exempt because it performs no state-
    changing action beyond clearing the user’s own session.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request):
        from django.contrib.auth import logout as django_logout

        django_logout(request)
        return Response({"detail": "Logged out."})


class DeleteAccountView(APIView):
    """Delete the authenticated user's account and all related data.

    Performs a hard delete on the Django User instance which cascades to
    related models (UserProfile, Translation, etc.). Returns HTTP 204 on
    success so the SPA can clear local state and redirect to login.
    """

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        # Keep a reference to the user before deleting for potential auditing
        user = request.user
        username = user.username
        user.delete()
        # If we reach here, deletion succeeded
        return Response(
            {"detail": f"User '{username}' and related data deleted."}, status=204
        )


class OAuthErrorView(APIView):
    """Return a JSON error when OAuth association fails (e.g., already linked)."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        message = request.GET.get("message", "OAuth error")
        return Response({"error": message}, status=400)


class TaskStatusView(APIView):
    """Return Celery task status (and result/timing) for a given task_id.

    Example response while running:
        {
          "task_id": "c2e3...",
          "state": "STARTED",
          "started_at": "2024-06-12T14:33:11.123Z",
          "finished_at": null
        }

    Example response when finished:
        {
          "task_id": "c2e3...",
          "state": "SUCCESS",
          "started_at": "2024-06-12T14:33:11.123Z",
          "finished_at": "2024-06-12T14:33:15.007Z",
          "result": "Hallo Welt!"
        }
    """

    permission_classes = [permissions.IsAuthenticated]

    def _to_iso(self, value):
        """Return ISO-8601 string for datetime or epoch seconds, else None."""
        if value is None:
            return None
        # Celery backends may return either datetime or float timestamps
        from datetime import datetime

        from django.utils import timezone

        # If it's already a datetime, ensure it is aware & ISO-format it
        if isinstance(value, datetime):
            if timezone.is_naive(value):
                value = timezone.make_aware(value, timezone.utc)
            return value.isoformat()
        # Fallback: treat as epoch seconds
        try:
            return (
                datetime.utcfromtimestamp(float(value))
                .replace(tzinfo=timezone.utc)
                .isoformat()
            )
        except Exception:
            return None

    def get(self, request, task_id):
        res = AsyncResult(str(task_id))
        data = {
            "task_id": str(task_id),
            "state": res.state,
            "started_at": self._to_iso(getattr(res, "date_created", None)),
            "finished_at": self._to_iso(getattr(res, "date_done", None)),
        }
        if res.state == "SUCCESS":
            data["result"] = res.result
        elif res.state == "FAILURE":
            data["error"] = str(res.result)
        return Response(data)
