import logging
from django.http import JsonResponse
from django.db import DatabaseError
from django.core.exceptions import ValidationError, PermissionDenied

logger = logging.getLogger("app_logger")

logger.info("ErrorHandlerMiddleware loaded")

class ErrorHandlerMiddleware:  # ← exact name & casing
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            response = self.get_response(request)
            return response
        except ValidationError as e:
            logger.error(f"Validation error: {e}")
            return JsonResponse(
                {"error": "Validation failed", "details": str(e)},
                status=400
            )
        except DatabaseError as e:
            logger.error(f"Database error: {e}")
            return JsonResponse(
                {"error": "Database error occurred"},
                status=500
            )
        except PermissionDenied as e:
            logger.warning(f"Auth error: {e}")
            return JsonResponse(
                {"error": "Authentication/Authorization failed", "details": str(e)},
                status=403
            )
        except Exception as e:
            logger.critical(f"Unhandled error: {e}", exc_info=True)
            return JsonResponse(
                {"error": "An unexpected error occurred"},
                status=500
            )

