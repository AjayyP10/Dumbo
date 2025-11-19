#!/usr/bin/env bash
set -euo pipefail

# Anchor to project root regardless of where script is called from
cd "$(dirname "$0")"

# -----------------------------
# Backend (Django) dependencies
# -----------------------------
pip install --upgrade pip setuptools wheel
pip install -r backend/requirements.txt

# -----------------------------
# Django housekeeping
# -----------------------------
# Run database migrations (DATABASE_URL is provided via Render env vars)
python backend/manage.py migrate --noinput

# --------------------------------------------------
# Create initial superuser if credentials are supplied
# --------------------------------------------------
# Set these env vars in Render > Environment or render.yaml:
#   DJANGO_SUPERUSER_USERNAME, DJANGO_SUPERUSER_PASSWORD, DJANGO_SUPERUSER_EMAIL
python - <<'PY'
import os, django, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.dumbo.settings')
try:
    django.setup()
    from django.contrib.auth import get_user_model
    User = get_user_model()
    username = os.getenv('DJANGO_SUPERUSER_USERNAME')
    password = os.getenv('DJANGO_SUPERUSER_PASSWORD')
    email = os.getenv('DJANGO_SUPERUSER_EMAIL', '')
    if username and password:
        if not User.objects.filter(username=username).exists():
            print(f"Creating initial superuser {username}…")
            User.objects.create_superuser(username=username, email=email, password=password)
        else:
            print("Superuser already exists, skipping.")
    else:
        print("DJANGO_SUPERUSER_* env vars not set; skipping superuser creation.")
except Exception as e:
    print("[WARNING] Unable to create superuser:", e, file=sys.stderr)
PY

# Collect static files so that Whitenoise or your web server can serve them
python backend/manage.py collectstatic --noinput

# The start command defined in Render will launch the app (e.g. gunicorn).