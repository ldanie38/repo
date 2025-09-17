from django.contrib.auth import get_user_model

def get_all_users():
    User = get_user_model()
    return User.objects.all()
