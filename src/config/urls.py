"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from config.views import home
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("", home, name="home"),
    path("admin/", admin.site.urls),
    
    # Legacy auth endpoints
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/", include("auth_app.urls")),

    # Versioned API endpoints
    path("api/v1/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair_v1"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh_v1"),
    path("api/v1/", include("crm.urls", namespace="crm")),
    path("extension/landing/", views.extension_landing, name="extension_landing"),
    
]

