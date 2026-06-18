from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def home(request):
    return JsonResponse({"message": "EduShare API is running"})

urlpatterns = [
    path("", home),
    path("admin/", admin.site.urls),
    
    # 💡 1. Keep this so all login/register/me routes continue working perfectly:
    path("api/auth/", include("users.urls")),
    
    # 💡 2. Add this line so all post, vote, and comment routes can also find users.urls:
    path("api/", include("users.urls")),
]