from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from config.views import home, extension_landing, health_check 

def root_ok(request):
    return JsonResponse({"status": "ok"})

def test_error(request):
    raise ValidationError("This is a test validation error")

urlpatterns = [
    path("", home, name="home"),
    path("admin/", admin.site.urls),
    
    path("", root_ok),
    path("test/", test_error),
    path('health/', health_check),

    # Legacy auth endpoints
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/", include("auth_app.urls")),

    # Versioned API endpoints
    path("api/v1/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair_v1"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh_v1"),
    path("api/", include("crm.urls", namespace="crm")),


    # Extension landing page
    path("extension/landing/", extension_landing, name="extension_landing"),
]
