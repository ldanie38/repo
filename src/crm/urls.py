from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, LeadViewSet, CampaignViewSet, TagViewSet, list_labels, create_label

app_name = "crm"

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")
router.register(r"leads", LeadViewSet, basename="lead")
router.register(r"campaigns", CampaignViewSet, basename="campaign")
router.register(r"tags", TagViewSet, basename="tag")

urlpatterns = [
    path("", include(router.urls)),
    path("labels/", list_labels, name="list_labels"),
    path("labels/create/", create_label, name="create_label"),
]


