from django.apps import AppConfig


class SocialUserDescriptor:
    """Descriptor that allows social-core to set/get social_user on User instances."""

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, "_social_user", None)

    def __set__(self, obj, value):
        obj._social_user = value


class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "backend.api"

    def ready(self):
        # Ensure signal handlers are registered
        from django.contrib.auth import get_user_model

        from . import signals  # noqa: F401

        User = get_user_model()

        # Add writable social_user attribute for social-core pipeline
        if not hasattr(User, "social_user") or not isinstance(
            getattr(User, "social_user", None), SocialUserDescriptor
        ):
            User.add_to_class("social_user", SocialUserDescriptor())

        # Patch DjangoUserMixin.get_social_user (direct provider query)
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
