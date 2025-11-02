#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -o errexit

# -----------------------------
# Backend (Django) dependencies
# -----------------------------
# Upgrade pip to latest and install Python requirements
pip install --upgrade pip setuptools wheel
pip install -r backend/requirements.txt
# Explicitly ensure SimpleJWT is installed (redundant if already in requirements but helps CI clarity)
pip install "djangorestframework-simplejwt>=5.3"

# -----------------------------
# Frontend (React + Vite) build
# -----------------------------
# Install Node dependencies and build the production bundle
cd frontend
npm ci
npm run build
cd ..

# -----------------------------
# Django housekeeping
# -----------------------------
# Run database migrations (DATABASE_URL is provided via Render env vars)
python backend/manage.py migrate --noinput

# Collect static files so that Whitenoise or your web server can serve them
python backend/manage.py collectstatic --noinput

# The start command defined in Render will launch the app (e.g. gunicorn).