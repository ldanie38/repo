from django.urls import path
from .views import LogsView, ExtensionLogIngestView

urlpatterns = [
    path("",          LogsView.as_view(),            name="logs-view"),
    path("ingest/",   ExtensionLogIngestView.as_view(), name="logs-ingest"),
]
