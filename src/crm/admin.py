from django.contrib import admin
from .models import Lead, Campaign, Label, Tag

@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "start_date", "end_date", "is_active", "budget", "created_at")
    search_fields = ("name",)

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "status", "owner", "campaign", "created_at")
    list_filter = ("status", "campaign")
    search_fields = ("name", "email", "owner__username")


@admin.register(Label)
class LabelAdmin(admin.ModelAdmin):
    list_display = ("id", "name")  
    
    
@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "color")  # columns in the admin list view
    search_fields = ("name",)               # adds a search box
    list_filter = ("color",)                 # filter sidebar by color