from rest_framework import serializers
from django.contrib.auth.models import User
from .auth_service import create_user

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("username", "password", "email")

    def create(self, validated_data):
        return create_user(**validated_data)

