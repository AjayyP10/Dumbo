#!/usr/bin/env bash
set -euo pipefail

# Anchor to project root regardless of where script is called from
cd "$(dirname "$0")"

# -----------------------------
# Backend (Django) dependencies
# -----------------------------
pip install --upgrade pip setuptools wheel
pip install -r backend/requirements.txt

# --------------------------------------------------
# Collect static files so that Whitenoise or your web server can serve them
# --------------------------------------------------
python backend/manage.py collectstatic --noinput

# NOTE: Database migrations are now handled in the start command
# to ensure DATABASE_URL is available at runtime, not build time.