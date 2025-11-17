from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView

from .views import root

urlpatterns = [
    path("", root, name="root"),
    path(
        "favicon.ico", RedirectView.as_view(url="/static/favicon.ico", permanent=True)
    ),
    path("admin/", admin.site.urls),
    path("api/", include("backend.api.urls")),
]
