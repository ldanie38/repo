from django.shortcuts import render

from django.http import JsonResponse
from django.shortcuts import redirect

def home(request):
    return render(request, "home.html")

def health_check(request):
    return JsonResponse({"status": "ok", "message": "Backend is running"})


def extension_landing(request):
    return redirect("/")






