from django.contrib.auth import user_logged_in, user_login_failed
from django.dispatch import receiver
from django.utils import timezone
from django.contrib.auth.models import AnonymousUser
from .models import UserLoginLog

def _get_request_meta(request):
    """Return (ip_address, user_agent) tuple from request, tolerant of missing info."""
    ip = request.META.get("REMOTE_ADDR")
    # If your setup uses X-Forwarded-For, handle it here
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        ip = xff.split(",")[0].strip()
    ua = request.META.get("HTTP_USER_AGENT", "")
    return ip, ua

@receiver(user_logged_in)
def log_successful_login(sender, request, user, **kwargs):
    ip, ua = _get_request_meta(request)
    UserLoginLog.objects.create(
        user=user, ip_address=ip, user_agent=ua, success=True, timestamp=timezone.now()
    )

@receiver(user_login_failed)
def log_failed_login(sender, credentials, request, **kwargs):
    username = credentials.get("username")
    user = None
    # Try to look up user object (optional—surround with try/except in case)
    from django.contrib.auth import get_user_model
    try:
        user = get_user_model().objects.filter(username=username).first()
    except Exception:
        pass

    ip, ua = _get_request_meta(request)
    UserLoginLog.objects.create(
        user=user,
        ip_address=ip,
        user_agent=ua,
        success=False,
        timestamp=timezone.now(),
    )