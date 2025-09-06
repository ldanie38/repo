from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Lead, Campaign

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "is_active", "is_staff", "date_joined"]
        read_only_fields = fields  # read-only for MVP

class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = ["id", "name", "start_date", "end_date", "budget", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

class LeadSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source="owner.username", read_only=True)

    class Meta:
        model = Lead
        fields = [
            "id", "name", "email", "status", "owner", "owner_username",
            "campaign", "notes", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "owner_username", "created_at", "updated_at"]
