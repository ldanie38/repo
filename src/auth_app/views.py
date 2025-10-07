# src/auth_app/views.py

from django.shortcuts import render  # (unused by API views but fine to keep)

# DRF imports
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle

# Django auth utilities
from django.contrib.auth.models import User as DjangoUser  # keep for RegisterView
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator

# Email + helpers
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils.http import urlsafe_base64_decode

# Local
from .serializers import RegisterSerializer
from django.contrib.auth.password_validation import validate_password
from rest_framework.permissions import IsAuthenticated

class RegisterView(generics.CreateAPIView):
    """
    Public registration endpoint (if you keep it enabled):
    POST body is validated by RegisterSerializer.
    """
    queryset = DjangoUser.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer


class PasswordForgotView(APIView):
    """
    POST /api/auth/password/forgot
    Body: {"email": "<string>"}
    Always returns {"ok": true} (HTTP 200).

    If a user exists AND has a usable local password:
      - generate one-time token (default_token_generator)
      - send reset email (dev email backend prints to console or file)
    If FB-only (no local password) or unknown email:
      - do nothing, still return ok:true

    Throttled to 5 requests / 15 minutes / IP via DRF ScopedRateThrottle.
    (Make sure settings.REST_FRAMEWORK has DEFAULT_THROTTLE_RATES["password_forgot"] = "5/15min")
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_forgot"

    def post(self, request, *args, **kwargs):
        email = (request.data.get("email") or "").strip()

        # We always respond with ok:true (don’t leak existence)
        if not email:
            return Response({"ok": True})

        User = get_user_model()
        try:
            user = User.objects.filter(email__iexact=email).first()
        except Exception:
            user = None

        # Only send if user exists and has a usable local password (not FB-only)
        if user and getattr(user, "has_usable_password", None) and user.has_usable_password():
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            # Build a simple reset URL for dev; wire to real frontend later
            domain = request.get_host() or "localhost:8000"
            protocol = "https" if request.is_secure() else "http"
            reset_url = f"{protocol}://{domain}/reset-password?uid={uid}&token={token}"

            subject = "Reset your Genius Messenger CRM password"
            message = (
                "You (or someone else) requested a password reset.\n\n"
                f"Use this link (valid for ~1 hour):\n{reset_url}\n\n"
                "If you didn’t request this, you can ignore this email."
            )

            try:
                # EMAIL_BACKEND set in settings controls where this goes (console/file/etc.)
                send_mail(subject, message, None, [email], fail_silently=True)
            except Exception:
                # Dev-friendly: don’t crash on email transport issues
                pass

        # Indistinguishable response
        return Response({"ok": True})



class PasswordResetView(APIView):

    """
    POST /api/auth/password/reset/
    Body: { "uid": "<string>", "token": "<string>", "new_password": "<string>" }

    Returns 200 with:
      - {"ok": true} on success
      - {"ok": false, "error": "Invalid or expired token"} on any failure
        (invalid uid, user not found, bad/expired token, weak password, etc.)
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    def post(self, request, *args, **kwargs):
        uidb64 = (request.data.get("uid") or "").strip()
        token  = (request.data.get("token") or "").strip()
        new_pw = (request.data.get("new_password") or "").strip()

        # Single safe failure response to avoid leaking details
        def fail():
            return Response({"ok": False, "error": "Invalid or expired token"})

        if not uidb64 or not token or not new_pw:
            return fail()

        # Resolve user from uid
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
        except Exception:
            return fail()

        User = get_user_model()
        try:
            user = User.objects.get(pk=uid)
        except User.DoesNotExist:
            return fail()

        # Validate token
        if not default_token_generator.check_token(user, token):
            return fail()

        # Run Django's password validators (strength rules)
        try:
            validate_password(new_pw, user=user)
        except Exception:
            # Do not reveal validator details; keep response indistinguishable
            return fail()

        # Set password
        user.set_password(new_pw)
        user.save(update_fields=["password"])

        return Response({"ok": True})


class PasswordChangeView(APIView):

    """
    POST /api/auth/password/change/    (JWT required)
    Body: { "current_password": "<str>", "new_password": "<str>" }

    Success: {"ok": true}
    Failure (generic): {"ok": false, "error": "Invalid password change request"}
    Throttling: password_change -> 10/hour
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_change"

    def post(self, request, *args, **kwargs):
        current = (request.data.get("current_password") or "").strip()
        new_pw  = (request.data.get("new_password") or "").strip()

        def fail():
            return Response({"ok": False, "error": "Invalid password change request"})

        if not current or not new_pw:
            return fail()

        user = request.user

        # Verify current password
        if not user.check_password(current):
            return fail()

        # Strength validators
        try:
            validate_password(new_pw, user=user)
        except Exception:
            return fail()

        # Apply new password
        user.set_password(new_pw)
        user.save(update_fields=["password"])

        return Response({"ok": True})

class LogoutView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "logout"  # optional, add rate if desired

    def post(self, request, *args, **kwargs):
        # Stateless logout: nothing to invalidate server-side.
        return Response({"ok": True})