from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, filters
from .models import Lead, Campaign
from .serializers import LeadSerializer, CampaignSerializer, UserSerializer

User = get_user_model()

class IsAuthenticatedCRUD(permissions.IsAuthenticated):
    """We just need any logged-in user to access CRUD."""

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only users for MVP (safe)."""
    queryset = User.objects.all().order_by("id")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticatedCRUD]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["username", "first_name", "last_name", "email"]
    ordering_fields = ["id", "date_joined", "username"]

class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticatedCRUD]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["created_at", "updated_at", "name"]

class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.select_related("owner", "campaign").all()
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticatedCRUD]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "email", "status", "owner__username"]
    ordering_fields = ["created_at", "updated_at", "name"]

    def perform_create(self, serializer):
        # If you want default owner to the current user when not provided, uncomment:
        # owner = serializer.validated_data.get("owner") or self.request.user
        # serializer.save(owner=owner)
        serializer.save()
