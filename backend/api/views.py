import os, requests
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Translation, UserLoginLog
from .serializers import (
    TranslationSerializer,
    RegisterSerializer,
    UserLoginLogSerializer,
)
from .models import Translation, UserLoginLog
from .permissions import IsOwner

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemma-3-27b-it:free"
PROMPT_TMPL = (
    'Translate the following English text into German at {level} proficiency level: "{input_text}". '
    'Use simple vocabulary and grammar appropriate for that level, avoid overly literal phrasing, and preserve paragraphs. '
    'Respond with ONLY the translated text (no additional explanations).'
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

    def get(self, request):
        return Response(
            {
                "message": "Send a POST with {input_text, level} and Bearer token to receive a translation.",
                "allowed_levels": ["A1", "A2", "B1", "B2"],
            }
        )

    def post(self, request):
        text = request.data.get("input_text", "")
        level = request.data.get("level", "")
        if level not in ["A1", "A2", "B1", "B2"]:
            return Response({"error": "Invalid CEFR level"}, status=400)

        # First, attempt to reuse a recent identical translation to avoid unnecessary API calls
        # Check if we already translated this text at this level for ANY user to save an API call
        existing = Translation.objects.filter(
            input_text=text, level=level
        ).order_by("-created_at").first()
        if existing:
            return Response({"translation": existing.output_text}, status=200)

        headers = {
            "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": "You are a helpful translator."},
                {
                    "role": "user",
                    "content": PROMPT_TMPL.format(input_text=text, level=level),
                },
            ],
        }
        # Retry up to 3 times with exponential back-off if upstream returns 429
        retries = 0
        backoff = 2  # seconds
        while True:
            try:
                llm_resp = requests.post(
                    OPENROUTER_URL, json=payload, headers=headers, timeout=30
                )
                if llm_resp.status_code == 429 and retries < 3:
                    retries += 1
                    import time
                    time.sleep(backoff)
                    backoff *= 2  # exponential
                    continue
                llm_resp.raise_for_status()
                break  # success reached
            except requests.exceptions.HTTPError as e:
                if e.response is not None and e.response.status_code == 429 and retries < 3:
                    retries += 1
                    import time
                    time.sleep(backoff)
                    backoff *= 2
                    continue
                # Exceeded retries or different HTTP error
                if e.response is not None and e.response.status_code == 429:
                    return Response(
                        {"error": "Upstream rate limit still exceeded. Please try later."},
                        status=429,
                    )
                return Response({"error": str(e)}, status=e.response.status_code if e.response else 500)
            except requests.exceptions.RequestException:
                return Response(
                    {"error": "Upstream translation service unavailable. Please try later."},
                    status=503,
                )

        raw_answer = llm_resp.json()["choices"][0]["message"]["content"]

        # Use the entire translated text, preserving original paragraph breaks
        translation = raw_answer.strip()

        Translation.objects.create(
            user=request.user, input_text=text, output_text=translation, level=level
        )
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