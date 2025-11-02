from rest_framework import serializers
from .models import Translation

class TranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Translation
        fields = ["id", "input_text", "output_text", "level", "created_at"]
        read_only_fields = ["id", "output_text", "created_at"]