# src/config/urls.py

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.http import JsonResponse

from config.views import home, extension_landing, health_check

def root_ok(request):
    return JsonResponse({"status": "ok"})

def test_error(request):
    raise ValidationError("This is a test validation error")

urlpatterns = [
    # Health check endpoint
    path("api/health/", lambda request: JsonResponse({"status": "ok"})),
    # Home & Admin
    path("", home, name="home"),
    path("admin/", admin.site.urls),

    # Health & Test endpoints
    path("", root_ok, name="root_ok"),
    path("test/", test_error, name="test_error"),
    path("health/", health_check, name="health_check"),

    # Extension landing
    path("extension/landing/", extension_landing, name="extension_landing"),

    # ----- Authentication -----
    path("api/auth/login/",   TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(),     name="token_refresh"),
    path("api/auth/", include("auth_app.urls")),

    # ----- CRM Endpoints -----
    path("api/", include(("crm.urls", "crm"), namespace="crm")),
]

