from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from config.views import home, extension_landing, health_check

def root_ok(request):
    return JsonResponse({"status": "ok"})

def test_error(request):
    raise ValidationError("This is a test validation error")

urlpatterns = [
    path("", home, name="home"),
    path("admin/", admin.site.urls),

    # Health & test endpoints
    path("", root_ok),
    path("test/", test_error),
    path("health/", health_check),

    # JWT auth endpoints
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/", include("auth_app.urls")),

    # CRM API
    path("api/", include(("crm.urls", "crm"), namespace="crm")),

    # Extension landing page
    path("extension/landing/", extension_landing, name="extension_landing"),
]



