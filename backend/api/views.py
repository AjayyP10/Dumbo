import os, requests
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Translation, UserLoginLog
from .serializers import TranslationSerializer, RegisterSerializer
from .permissions import IsOwner

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemma-3-27b-it:free"
PROMPT_TMPL = (
    'Translate "{input_text}" to German at {level} proficiency level. '
    'Use simple vocabulary and grammar. Avoid literal translations. '
    'Respond with ONLY the translated sentence and nothing else.'
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
        text = request.data.get("input_text", "")[:500]
        level = request.data.get("level", "")
        if level not in ["A1", "A2", "B1", "B2"]:
            return Response({"error": "Invalid CEFR level"}, status=400)

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
        llm_resp = requests.post(OPENROUTER_URL, json=payload, headers=headers, timeout=30)
        llm_resp.raise_for_status()
        raw_answer = llm_resp.json()["choices"][0]["message"]["content"]

        # Keep only the first non-empty line so we don’t send explanations/bullets back.
        lines = [ln.strip() for ln in raw_answer.splitlines() if ln.strip()]
        translation = lines[0] if lines else raw_answer.strip()

        obj = Translation.objects.create(
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