from django.urls import include, path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .cookie_auth import (
    CookieLoginView,
    CookieLogoutView,
    CookieMeView,
    CookieRefreshView,
)
from .throttles import LoginAnonRateThrottle
from .views import (
    DeleteAccountView,
    ExportHistoryView,
    GoogleAuthComplete,
    HealthCheckView,
    HistoryListView,
    LoginLogListView,
    OAuthErrorView,
    RegisterView,
    TaskStatusView,
    TranslateView,
    UserProfileView,
)


class ThrottledTokenObtainPairView(TokenObtainPairView):
    """Token endpoint with login brute-force protection."""

    throttle_classes = [LoginAnonRateThrottle]


class ThrottledRegisterView(RegisterView):
    """Registration endpoint with brute-force protection."""

    throttle_classes = [LoginAnonRateThrottle]


urlpatterns = [
    # ── Health ──────────────────────────────────────────────────────
    path("health/", HealthCheckView.as_view(), name="health"),
    # ── Cookie-based auth (httpOnly JWT cookies) ────────────────────
    path("auth/login/", CookieLoginView.as_view(), name="auth_login"),
    path("auth/refresh/", CookieRefreshView.as_view(), name="auth_refresh"),
    path("auth/logout/", CookieLogoutView.as_view(), name="auth_logout"),
    path("auth/me/", CookieMeView.as_view(), name="auth_me"),
    # ── Legacy JSON-token auth (kept for backward compatibility) ────
    path("oauth/", include("social_django.urls", namespace="social")),
    path(
        "oauth/google/jwt/", GoogleAuthComplete.as_view(), name="google_auth_complete"
    ),
    path("token/", ThrottledTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # ── API endpoints ───────────────────────────────────────────────
    path("translate/", TranslateView.as_view(), name="translate"),
    path("history/", HistoryListView.as_view(), name="history"),
    path("register/", ThrottledRegisterView.as_view(), name="register"),
    path("login-logs/", LoginLogListView.as_view(), name="login_logs"),
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("delete-account/", DeleteAccountView.as_view(), name="delete_account"),
    path("export-history/", ExportHistoryView.as_view(), name="export_history"),
    path("oauth/error/", OAuthErrorView.as_view(), name="oauth_error"),
    path("tasks/<uuid:task_id>/", TaskStatusView.as_view(), name="task_status"),
]
