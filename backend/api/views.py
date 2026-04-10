import csv
import os

import httpx
from celery.result import AsyncResult
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.http import HttpResponse, HttpResponseRedirect
from rest_framework import generics, permissions
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

# Import shared translation engine (no circular imports)
from .cache_utils import (
    _compress,
    _decompress,
    _l1_get,
    _l1_set,
    chunk_get,
    chunk_set,
    make_cache_key,
)
from .models import Translation, UserLoginLog
from .serializers import (
    RegisterSerializer,
    TranslationSerializer,
    UserLoginLogSerializer,
)
from .translation_engine import (
    _split_into_chunks,
    translate_chunk_sync,
)


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

        # --- Input validation ---
        if not text:
            return Response({"error": "input_text must not be empty"}, status=400)

        MAX_INPUT_CHARS = int(os.getenv("MAX_INPUT_CHARS", "10000"))
        if len(text) > MAX_INPUT_CHARS:
            return Response(
                {
                    "error": f"input_text exceeds maximum length of {MAX_INPUT_CHARS} "
                    f"characters (got {len(text)})."
                },
                status=400,
            )

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
        try:
            async_threshold = int(os.getenv("ASYNC_TRANSLATE_THRESHOLD", "3000"))
        except (ValueError, TypeError):
            async_threshold = 3000
        if request.query_params.get("async") == "1" or len(text) > async_threshold:
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
                try:
                    from .translation_engine import _build_prompt

                    prompt = _build_prompt(chunk, src_lang_name, tgt_lang_name, level)
                    translated_chunk = translate_chunk_sync(
                        client, prompt, level, tgt_lang_name
                    )
                except RuntimeError as e:
                    return Response({"error": str(e)}, status=503)
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
    Sets httpOnly JWT cookies and redirects to the frontend — **no tokens in URL**.
    """

    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response({"error": "Authentication failed"}, status=401)

        from django.conf import settings

        refresh = RefreshToken.for_user(request.user)
        email = request.user.email or request.user.get_username()
        refresh["email"] = email
        refresh.access_token["email"] = email

        cookie_name = getattr(settings, "JWT_AUTH_COOKIE", "access_token")
        refresh_name = getattr(settings, "JWT_REFRESH_AUTH_COOKIE", "refresh_token")
        same_site = getattr(settings, "JWT_COOKIE_SAMESITE", "Lax")
        secure = getattr(settings, "JWT_COOKIE_SECURE", True)

        response = HttpResponseRedirect(
            os.getenv("FRONTEND_URL", "http://localhost:5173") + "/oauth-complete"
        )
        # Access cookie — 1 hour
        response.set_cookie(
            key=cookie_name,
            value=str(refresh.access_token),
            max_age=3600,
            httponly=True,
            secure=secure,
            samesite=same_site,
            path="/",
        )
        # Refresh cookie — 30 days
        response.set_cookie(
            key=refresh_name,
            value=str(refresh),
            max_age=30 * 24 * 3600,
            httponly=True,
            secure=secure,
            samesite=same_site,
            path="/",
        )
        return response


class DeleteAccountView(APIView):
    """Delete the authenticated user's account and all related data.

    Performs a hard delete on the Django User instance which cascades to
    related models (UserProfile, Translation, etc.). Returns HTTP 204 on
    success so the SPA can clear local state and redirect to login.
    """

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        user = request.user
        user.delete()
        return Response(status=204)


class OAuthErrorView(APIView):
    """Return a JSON error when OAuth association fails (e.g., already linked)."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        import logging

        logger = logging.getLogger(__name__)

        message = request.GET.get("message", "OAuth error")
        exception = request.GET.get("exception", "")
        code = request.GET.get("code", "")

        logger.error(
            "OAuth error: message=%s, exception=%s, code=%s", message, exception, code
        )

        return Response(
            {
                "error": message,
                "exception": exception,
                "code": code,
            },
            status=400,
        )


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
            return datetime.fromtimestamp(float(value), tz=timezone.utc).isoformat()
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


class HealthCheckView(APIView):
    """Health check endpoint for Render / load balancers.

    Returns 200 when the app is alive.  Extend with DB / cache probes
    if you want a deeper readiness check.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        health = {"status": "ok"}
        # Quick DB probe
        try:
            from django.db import connection

            connection.ensure_connection()
            health["database"] = "ok"
        except Exception as exc:
            health["database"] = f"error: {exc}"
        # Quick cache probe
        try:
            from django.core.cache import cache

            cache.set("__health__", 1, 5)
            health["cache"] = "ok" if cache.get("__health__") == 1 else "degraded"
        except Exception as exc:
            health["cache"] = f"error: {exc}"

        status_code = 200 if health.get("database") == "ok" else 503
        return Response(health, status=status_code)
