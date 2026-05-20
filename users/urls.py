from django.urls import path
from .views import register, login_view, get_current_user

urlpatterns = [
    path("register/", register),
    path("login/", login_view),
    path("me/", get_current_user),
]