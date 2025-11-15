from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    TranslateView,
    HistoryListView,
    RegisterView,
    LoginLogListView,
    ExportHistoryView,
    TaskStatusView,
    GoogleAuthComplete,
    UserProfileView,
)

urlpatterns = [
    path("oauth/", include("social_django.urls", namespace="social")),
    # After social-auth processes the callback it will redirect here to issue JWT tokens
    path("oauth/google/jwt/", GoogleAuthComplete.as_view(), name="google_auth_complete"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("translate/", TranslateView.as_view(), name="translate"),
    path("history/", HistoryListView.as_view(), name="history"),
    path("register/", RegisterView.as_view(), name="register"),
    path("login-logs/", LoginLogListView.as_view(), name="login_logs"),
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("export-history/", ExportHistoryView.as_view(), name="export_history"),
    path("tasks/<uuid:task_id>/", TaskStatusView.as_view(), name="task_status"),
]