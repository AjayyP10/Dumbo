#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -o errexit

# -----------------------------
# Backend (Django) dependencies
# -----------------------------
# Install Python requirements
pip install -r backend/requirements.txt

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