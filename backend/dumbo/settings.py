import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# ENV
load_dotenv(BASE_DIR / ".env")  # optional local .env
SECRET_KEY = os.getenv("SECRET_KEY", "unsafe-secret-for-dev")
DEBUG = os.getenv("DEBUG", "True") == "True"

ALLOWED_HOSTS = ["localhost", "127.0.0.1", os.getenv("RENDER_EXTERNAL_HOSTNAME", "")]
CSRF_TRUSTED_ORIGINS = [f"https://{os.getenv('RENDER_EXTERNAL_HOSTNAME', '')}"]
CORS_ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")

INSTALLED_APPS = [
    "social_django",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "django_celery_results",  # store Celery task results in DB (optional)
    "backend.api",  # updated to fully qualified path
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "social_django.middleware.SocialAuthExceptionMiddleware",
]

ROOT_URLCONF = "backend.dumbo.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": [
            "django.template.context_processors.debug",
            "django.template.context_processors.request",
            "django.contrib.auth.context_processors.auth",
            "django.contrib.messages.context_processors.messages",
        ],},
    },
]
WSGI_APPLICATION = "backend.dumbo.wsgi.application"
ASGI_APPLICATION = "backend.dumbo.asgi.application"

# Database
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    DATABASES = {"default": dj_database_url.parse(DATABASE_URL, conn_max_age=600)}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# Password validation & auth
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",},
]

# DRF + JWT
# Authentication backends (add Google OAuth2)
AUTHENTICATION_BACKENDS = [
    "social_core.backends.google.GoogleOAuth2",
    "django.contrib.auth.backends.ModelBackend",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),

    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.AnonRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "user": os.getenv("THROTTLE_RATE_USER", "20/min"),
        "anon": os.getenv("THROTTLE_RATE_ANON", "10/min"),
    },
}

# Social Auth (Google)
SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = os.getenv("GOOGLE_CLIENT_ID")
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
SOCIAL_AUTH_LOGIN_REDIRECT_URL = "/api/oauth/google/jwt/"
# After social-auth completes OAuth handshake, redirect here to issue JWT tokens
SOCIAL_AUTH_LOGIN_ERROR_URL = "/api/oauth/error/"
# Ensure exceptions are passed to middleware instead of bubbling up as 500
SOCIAL_AUTH_RAISE_EXCEPTIONS = False
# If running behind HTTPS proxy (Render), tell social-auth to assume HTTPS
# Use HTTPS redirects only in production (Render)
SOCIAL_AUTH_REDIRECT_IS_HTTPS = not DEBUG

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# Static
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "static"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Caching: prefer Redis if CACHE_URL present, else fall back to local memory (dev)
CACHE_URL = os.getenv("CACHE_URL")  # e.g. redis://localhost:6379/1
if CACHE_URL:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": CACHE_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                # Avoid hammering Redis with serialization by using JSON serializer
                "SERIALIZER": "django_redis.serializers.json.JSONSerializer",
            },
            "TIMEOUT": int(os.getenv("CACHE_TTL", 3600)),  # 1 h default
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "unique-dumbo-cache",
            "TIMEOUT": int(os.getenv("CACHE_TTL", 600)),
        }
    }

# Celery configuration – use Redis broker / backend (falls back to CACHE_URL)
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL") or os.getenv("CACHE_URL") or "redis://localhost:6379/0"
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", CELERY_BROKER_URL)
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"

# Security
SECURE_SSL_REDIRECT = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG
# Ensure cookies are sent on first-party top-level navigations such as the OAuth
# redirect flow while still protecting against CSRF in cross-site requests.
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = not DEBUG