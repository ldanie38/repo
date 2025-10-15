from pathlib import Path
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging

# Logger name "extension" ships into your rotating file handlers
logger = logging.getLogger("extension")


class LogsView(APIView):
    """
    GET  /api/logs/?level=info|warning|error
    """
    permission_classes = []  # secure as needed

    def get(self, request):
        level = request.query_params.get("level")
        log_path = Path(settings.BASE_DIR) / "logs" / f"{settings.ENV}.log"
        if not log_path.exists():
            return Response({"detail": "No log file"}, status=404)

        lines = log_path.read_text().splitlines()[-200:]
        if level:
            lines = [l for l in lines if f"] {level.upper()}:" in l]

        return Response({"environment": settings.ENV, "entries": lines})


class ExtensionLogIngestView(APIView):
    """
    POST /api/logs/ingest/
    Accepts JSON { timestamp, level, message }
    """
    permission_classes = []  # secure as needed

    def post(self, request):
        data = request.data
        ts      = data.get("timestamp")
        lvl     = data.get("level", "INFO").upper()
        msg     = data.get("message", "")

        # Dispatch to the right logger method
        log_fn = getattr(logger, lvl.lower(), logger.info)
        log_fn(f"{ts}  {msg}")
        return Response(status=status.HTTP_201_CREATED)
