"""DRF authentication class that reads JWT tokens from httpOnly cookies.

Used as a drop-in replacement for
``rest_framework_simplejwt.authentication.JWTAuthentication`` so that existing
endpoints work transparently with **both**:

  • ``Authorization: Bearer <token>`` header (legacy)
  • httpOnly JWT cookies set by the cookie-auth endpoints
"""

from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """Authenticate via Bearer header **or** httpOnly JWT cookie."""

    def authenticate(self, request):
        # 1. Try the standard Bearer header first
        header = self.get_header(request)
        if header is None:
            raw_token = request.COOKIES.get(
                getattr(settings, "JWT_AUTH_COOKIE", "access_token")
            )
            if raw_token is not None:
                validated_token = self.get_validated_token(raw_token)
                return (self.get_user(validated_token), validated_token)
            return None

        return super().authenticate(request)
