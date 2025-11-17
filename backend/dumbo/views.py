from django.http import JsonResponse
from django.urls import reverse


def root(request):
    """
    Simple landing/health endpoint at “/”.
    Returns API metadata and useful links.
    """
    return JsonResponse(
        {
            "message": "Dumbo API",
            "endpoints": {
                "admin": request.build_absolute_uri(reverse("admin:index")),
                "api": request.build_absolute_uri("/api/"),
            },
        }
    )
