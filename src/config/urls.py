from django.contrib import admin
from django.urls import path, include
from config.views import home, extension_landing
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("", home, name="home"),
    path("admin/", admin.site.urls),

    # JWT auth endpoints
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/", include("auth_app.urls")),

    # CRM endpoints (users, leads, campaigns, tags, labels)
    path("api/", include(("crm.urls", "crm"), namespace="crm")),

    # Extension landing
    path("extension/landing/", extension_landing, name="extension_landing"),
]


