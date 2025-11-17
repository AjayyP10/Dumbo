from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "backend.api"

    def ready(self):
        # Ensure signal handlers are registered
        from . import signals  # noqa: F401
