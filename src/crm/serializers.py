from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Lead, Campaign, Tag, Label, Template




User = get_user_model()




class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = "__all__"




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
        


class LabelSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Label
        fields = ["id", "name", "color", "owner"]
        

        




class TemplateSerializer(serializers.ModelSerializer):
    label_name = serializers.CharField(source='label.name', read_only=True)

    class Meta:
        model = Template
        fields = ['id', 'name', 'content', 'label', 'label_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_label(self, label: Label):
        """
        Ensure the label belongs to the requesting user.
      
        """
        request = self.context.get('request')
        if request and hasattr(request, "user"):
            user = request.user
            # allow labels with no owner if that's desired; otherwise treat null-owner as not allowed
            if label.owner is not None and label.owner != user:
                raise serializers.ValidationError("You do not own this label.")
        return label

    def validate(self, attrs):
    
        name = attrs.get('name') if attrs.get('name') is not None else getattr(self.instance, 'name', None)
        content = attrs.get('content') if attrs.get('content') is not None else getattr(self.instance, 'content', None)
        label = attrs.get('label') if attrs.get('label') is not None else getattr(self.instance, 'label', None)

        if not name:
            raise serializers.ValidationError({'name': 'Name is required.'})
        if not content:
            raise serializers.ValidationError({'content': 'Content cannot be empty.'})
        if not label:
            raise serializers.ValidationError({'label': 'Please select a label.'})
        return attrs
