"""Cookie-based JWT authentication endpoints.

Instead of returning tokens in the response body (which the SPA stores in
localStorage), these views set the tokens as **httpOnly, Secure, SameSite**
cookies.  The SPA never sees the raw tokens, so XSS attacks cannot steal them.

Endpoints
---------
POST /api/auth/login/      – username + password → set access + refresh cookies
POST /api/auth/refresh/    – refresh cookie      → new access cookie
POST /api/auth/logout/     – clear all auth cookies
GET  /api/auth/me/         – return current user info (cookie-authenticated)
"""

from django.conf import settings
from django.contrib.auth import authenticate
from django.http import JsonResponse
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

# Cookie defaults
_COOKIE_NAME = getattr(settings, "JWT_AUTH_COOKIE", "access_token")
_REFRESH_NAME = getattr(settings, "JWT_REFRESH_AUTH_COOKIE", "refresh_token")
_SAMESITE = getattr(settings, "JWT_COOKIE_SAMESITE", "Lax")
_SECURE = getattr(settings, "JWT_COOKIE_SECURE", True)


def _set_cookie(response, name: str, value: str, max_age: int):
    """Set an httpOnly, Secure, SameSite cookie on *response*."""
    response.set_cookie(
        key=name,
        value=value,
        max_age=max_age,
        httponly=True,  # JavaScript cannot read this cookie
        secure=_SECURE,
        samesite=_SAMESITE,
        path="/",
    )


def _delete_cookie(response, name: str):
    response.delete_cookie(key=name, path="/", samesite=_SAMESITE)


class CookieLoginView(APIView):
    """Authenticate with username + password and set httpOnly JWT cookies."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")

        if not username or not password:
            return Response({"error": "username and password are required"}, status=400)

        user = authenticate(username=username, password=password)
        if user is None:
            return Response({"error": "Invalid credentials"}, status=401)

        refresh = RefreshToken.for_user(user)
        response = JsonResponse({"detail": "Logged in"})
        _set_cookie(
            response,
            _COOKIE_NAME,
            str(refresh.access_token),
            max_age=3600,  # 1 hour
        )
        _set_cookie(
            response,
            _REFRESH_NAME,
            str(refresh),
            max_age=30 * 24 * 3600,  # 30 days
        )
        return response


class CookieRefreshView(APIView):
    """Rotate access token using the refresh cookie."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(_REFRESH_NAME)
        if not refresh_token:
            return Response({"error": "Refresh cookie missing"}, status=401)
        try:
            refresh = RefreshToken(refresh_token)
        except Exception:
            return Response({"error": "Invalid refresh token"}, status=401)

        response = JsonResponse({"detail": "Refreshed"})
        _set_cookie(
            response,
            _COOKIE_NAME,
            str(refresh.access_token),
            max_age=3600,
        )
        return response


class CookieLogoutView(APIView):
    """Clear auth cookies (server-side logout)."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        response = JsonResponse({"detail": "Logged out"})
        _delete_cookie(response, _COOKIE_NAME)
        _delete_cookie(response, _REFRESH_NAME)
        return response


class CookieMeView(APIView):
    """Return the authenticated user's info (cookie-based)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = getattr(user, "profile", None)
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "display_name": getattr(profile, "display_name", None),
            }
        )
