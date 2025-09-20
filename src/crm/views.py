from django.contrib.auth import get_user_model
from rest_framework import viewsets
from .models import Lead, Campaign, Tag, Label
from .serializers import (
    UserSerializer,
    LeadSerializer,
    CampaignSerializer,
    TagSerializer,
)
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json


# -------------------------
# USER VIEWSET
# -------------------------
class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer

    def get_queryset(self):
        # Lazy load the User model so it doesn't run at import time
        User = get_user_model()
        return User.objects.all()


# -------------------------
# LEAD VIEWSET
# -------------------------
class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer


# -------------------------
# CAMPAIGN VIEWSET
# -------------------------
class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer


# -------------------------
# TAG VIEWSET
# -------------------------
class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer


# -------------------------
# LABEL ENDPOINTS
# -------------------------
def list_labels(request):
    labels = list(Label.objects.values("id", "name"))
    return JsonResponse(labels, safe=False)


@csrf_exempt
def create_label(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            name = data.get("name", "").strip()
            if not name:
                return JsonResponse({"error": "Name is required"}, status=400)

            label, created = Label.objects.get_or_create(name=name)
            return JsonResponse(
                {"id": label.id, "name": label.name, "created": created}
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid method"}, status=405)
