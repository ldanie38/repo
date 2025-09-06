from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Campaign(models.Model):
    name = models.CharField(max_length=150)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

class Lead(models.Model):
    STATUS_CHOICES = [
        ("new", "New"),
        ("contacted", "Contacted"),
        ("qualified", "Qualified"),
        ("lost", "Lost"),
        ("won", "Won"),
    ]

    name = models.CharField(max_length=200)
    email = models.EmailField()  # make unique=True later if you want
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="leads")
    campaign = models.ForeignKey(Campaign, on_delete=models.SET_NULL, null=True, blank=True, related_name="leads")
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} <{self.email}>"
