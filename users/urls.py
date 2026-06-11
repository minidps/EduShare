from django.urls import path
from .views import register, login_view, get_current_user, vote_post, get_posts, create_post

urlpatterns = [
    path('register/', register),
    path('login/', login_view),
    path('me/', get_current_user),
    path('vote/', vote_post),
    path('posts/', get_posts),
    path('posts/create/', create_post),
]
