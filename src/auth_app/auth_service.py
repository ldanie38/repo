from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password

def create_user(username: str, password: str, email: str = ""):
    return User.objects.create(
        username=username,
        email=email,
        password=make_password(password)
    )

## this  password is properly hashed before storing it in the database.