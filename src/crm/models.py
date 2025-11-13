from django.db import models
from django.conf import settings  # <--instead of get_user_model
from django.core.validators import RegexValidator



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


class Tag(models.Model):
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default="#cccccc")

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
    email = models.EmailField(unique=True)
    profile_url = models.URLField(blank=True, null=True)
    source = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    is_archived = models.BooleanField(default=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # <-- safe reference
        on_delete=models.CASCADE,
        related_name="leads"
    )
    campaign = models.ForeignKey(
        Campaign,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="leads"
    )
    tags = models.ManyToManyField(
        Tag,
        related_name="leads",
        blank=True
    )
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} <{self.email}>"




class Label(models.Model):

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="labels",
        null=True,
        blank=True
    )

    name = models.CharField(max_length=50)
    color = models.CharField(
        max_length=7,
        default="#ffffff",
        validators=[RegexValidator(regex=r'^#[0-9A-Fa-f]{6}$')]
    )

    class Meta:
        unique_together = ("owner", "name")

    def __str__(self):
        return f"{self.name} ({self.color})"


class Template(models.Model):
    name = models.CharField(max_length=120)
    content = models.TextField()
    label = models.ForeignKey('Label', on_delete=models.PROTECT, related_name='templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['name', 'label'], name='uniq_template_name_per_label')
        ]

