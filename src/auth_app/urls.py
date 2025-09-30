from django.urls import path
from .views import RegisterView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("register/", RegisterView.as_view(), name="register"),
]


##This urlpatterns block wires up three API endpoints 
##for user registration and JWT-based authentication using Django REST Framework and Simple JWT.
