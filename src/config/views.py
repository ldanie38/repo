from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse

def home(request):
    return render(request, "home.html")

def health_check(request):
    return JsonResponse({"status": "ok", "message": "Backend is running"})


@login_required
def extension_landing(request):
    return render(request, "landing.html")