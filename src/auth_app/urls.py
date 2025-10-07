from django.urls import path
from .views import RegisterView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import PasswordForgotView, PasswordResetView, PasswordChangeView, LogoutView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("password/forgot/", PasswordForgotView.as_view(), name="password_forgot"),
    path("password/reset/",  PasswordResetView.as_view(),  name="password_reset"),
    path("password/change/", PasswordChangeView.as_view(), name="password_change"),
    path("logout/", LogoutView.as_view(), name="logout"),
]


##This urlpatterns block wires up three API endpoints 
##for user registration and JWT-based authentication using Django REST Framework and Simple JWT.