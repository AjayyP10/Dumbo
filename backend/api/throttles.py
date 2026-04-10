from rest_framework.throttling import AnonRateThrottle as BaseAnon
from rest_framework.throttling import UserRateThrottle as BaseUser


class UserRateThrottle(BaseUser):
    """Default throttle for authenticated users (100/min in settings)."""

    scope = "user"


class LoginAnonRateThrottle(BaseAnon):
    """Stricter throttle for login attempts to prevent brute force."""

    scope = "login"
