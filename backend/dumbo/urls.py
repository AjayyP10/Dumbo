from django.contrib import admin
from django.urls import path, include
from .views import root

urlpatterns = [
    path("", root, name="root"),
    path("admin/", admin.site.urls),
    path("api/", include("backend.api.urls")),
]