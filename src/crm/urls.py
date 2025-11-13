# crm/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet,
    LeadViewSet,
    CampaignViewSet,
    TagViewSet,
    LabelViewSet,
    TemplateViewSet
  
)

router = DefaultRouter()
router.register("users",     UserViewSet,     basename="user")
router.register("leads",     LeadViewSet,     basename="lead")
router.register("campaigns", CampaignViewSet, basename="campaign")
router.register("tags",      TagViewSet,      basename="tag")
router.register("labels",    LabelViewSet,    basename="label")
router.register(r'templates', TemplateViewSet, basename='template')


urlpatterns = [
    # /api/users/, /api/labels/, etc.
    path("", include(router.urls)),
]




