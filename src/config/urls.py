from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from config.views import home, extension_landing, health_check

def root_ok(request):
    return JsonResponse({"status": "ok"})

def test_error(request):
    raise ValidationError("Test error")


urlpatterns = [
    path("",                     home,                           name="home"),
    path("admin/",               admin.site.urls),

    path("health/",              health_check,                   name="health_check"),
    path("status/",              root_ok,                        name="root_ok"),
    path("test-error/",          test_error,                     name="test_error"),

    # Token endpoints 
    path("api/auth/login/",      TokenObtainPairView.as_view(),  name="token_obtain_pair_auth"),
    path("api/auth/refresh/",    TokenRefreshView.as_view(),     name="token_refresh_auth"),
    path("api/token/",           TokenObtainPairView.as_view(),  name="token_obtain_pair"),
    path("api/token/refresh/",   TokenRefreshView.as_view(),     name="token_refresh"),

    # Auth app
    path("api/auth/",            include("src.auth_app.urls")),

    # Logs viewer & ingest
    path("api/logs/",            include("src.crm.api.urls")),

    # CRM’s existing endpoints 
    path("api/",                 include(("src.crm.urls", "crm"), namespace="crm")),

    # Extension landing
    path("extension/landing/",   extension_landing,              name="extension_landing"),
]


