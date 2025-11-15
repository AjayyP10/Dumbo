from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Translation, UserLoginLog, UserProfile

class TranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Translation
        fields = [
            "id",
            "input_text",
            "output_text",
            "level",
            "source_lang",
            "target_lang",
            "created_at",
        ]
        read_only_fields = ["id", "output_text", "created_at"]

class UserLoginLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserLoginLog
        fields = ("id", "timestamp", "ip_address", "user_agent", "success")
        read_only_fields = fields


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ("display_name",)
        extra_kwargs = {
            "display_name": {
                "required": True,
                "allow_blank": False,
                "min_length": 2,
                "max_length": 150,
            }
        }

    def validate_display_name(self, value):
        # Enforce uniqueness at serializer level for clearer error
        if UserProfile.objects.filter(display_name__iexact=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = get_user_model()
        fields = ("username", "email", "password")

    def create(self, validated_data):
        user = get_user_model().objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )
        return user