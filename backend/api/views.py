import os, requests
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Translation
from .serializers import TranslationSerializer
from .permissions import IsOwner

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemma-3-27b-it:free"
PROMPT_TMPL = (
    'Translate "{input_text}" to German at {level} proficiency level. '
    'Use simple vocabulary and grammar. Avoid literal translations. '
    'Respond with ONLY the translated sentence and nothing else.'
)

class TranslateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

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