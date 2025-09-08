from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from .views import health_check 
from django.core.exceptions import ValidationError

def root_ok(request):
    return JsonResponse({"status": "ok"})

def test_error(request):
    raise ValidationError("This is a test validation error")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", root_ok),
    path("test/", test_error),
    path('health/', health_check),
]
