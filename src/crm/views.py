

from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions
from .models import Lead, Campaign, Tag, Label
from .serializers import (
    UserSerializer,
    LeadSerializer,
    CampaignSerializer,
    TagSerializer,
    LabelSerializer
)


# src/crm/views.py
import logging
from rest_framework.views import APIView
from rest_framework.response import Response

logger = logging.getLogger("crm")

class DashboardView(APIView):
    def get(self, request):
        logger.info("Dashboard requested by user %s", request.user.id)
        try:
            # …some external call
            pass
        except TimeoutError:
            logger.error("Failed to connect to external API (timeout after 5s)")
        return Response({"ok": True})


# ——— USER VIEWSET ———
class UserViewSet(viewsets.ModelViewSet):
    """
    GET    /api/users/
    POST   /api/users/
    GET    /api/users/{id}/
    PUT    /api/users/{id}/
    DELETE /api/users/{id}/
    """
    serializer_class = UserSerializer

    def get_queryset(self):
        return get_user_model().objects.all()

# ——— LEAD VIEWSET ———
class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer

# ——— CAMPAIGN VIEWSET ———
class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer

# ——— TAG VIEWSET ———
class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

# ——— LABEL VIEWSET ———
class LabelViewSet(viewsets.ModelViewSet):
    serializer_class   = LabelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Label.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        # stamp the new Label with the current user
        serializer.save(owner=self.request.user)

