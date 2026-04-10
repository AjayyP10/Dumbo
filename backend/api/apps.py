from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "backend.api"

    def ready(self):
        # Ensure signal handlers are registered
        # Patch DjangoUserMixin.get_social_user (direct provider query)
        from social_django.storage import DjangoUserMixin

        from . import signals  # noqa: F401

        def patched_get_social_user(self, backend, user):
            """Patched get_social_user: direct provider query."""
            if user:
                provider = getattr(backend, "name", str(backend))
                from social_django.models import UserSocialAuth

                try:
                    return UserSocialAuth.objects.get(user=user, provider=provider)
                except UserSocialAuth.DoesNotExist:
                    return None
            return None

        DjangoUserMixin.get_social_user = patched_get_social_user
