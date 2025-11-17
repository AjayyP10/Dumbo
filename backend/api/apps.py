from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "backend.api"

    def ready(self):
        # Ensure signal handlers are registered
        # Monkey patch User.social_user property (returns primary social_auth)
        from django.contrib.auth import get_user_model

        from . import signals  # noqa: F401

        User = get_user_model()

        @property
        def social_user_property(self):
            from social_django.models import UserSocialAuth

            try:
                return UserSocialAuth.objects.filter(user=self).first()
            except Exception:
                return None

        if not hasattr(User, "social_user"):
            User.add_to_class("social_user", social_user_property)

        # Patch DjangoUserMixin.get_social_user (direct query)
        from social_django.storage import DjangoUserMixin

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
