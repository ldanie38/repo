from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, LeadViewSet, CampaignViewSet

app_name = "crm"

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")
router.register(r"leads", LeadViewSet, basename="lead")
router.register(r"campaigns", CampaignViewSet, basename="campaign")

urlpatterns = [
    path("", include(router.urls)),
]
