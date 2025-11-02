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
npm ci --prefix frontend
npm run build --prefix frontend

# -----------------------------
# Django housekeeping
# -----------------------------
# Run database migrations (DATABASE_URL is provided via Render env vars)
python backend/manage.py migrate --noinput

# Collect static files so that Whitenoise or your web server can serve them
python backend/manage.py collectstatic --noinput

# The start command defined in Render will launch the app (e.g. gunicorn).

set -e

# install frontend deps, build, copy into backend/static
cd frontend
npm ci
npm run build
cd ..

# install backend deps
python -m pip install --upgrade pip
pip install -r backend/requirements.txt

# collect static into /static
python backend/manage.py collectstatic --noinput