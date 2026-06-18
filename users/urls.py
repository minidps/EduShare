from django.urls import path
from .views import (
    register, 
    login_view, 
    get_current_user, 
    add_grade, 
    vote_post, 
    get_posts, 
    update_account, 
    create_post, 
    post_comments_api,
    pin_comment_api,
    report_comment_api,
    report_post_api
)

urlpatterns = [
    path('register/', register, name='register'),
    path('login/', login_view, name='login'),
    path('me/', get_current_user, name='current_user'),
    path('grades/add/', add_grade, name='add_grade'),
    path('posts/vote/', vote_post, name='vote_post'),
    path('posts/', get_posts, name='get_posts'),
    path('posts/create/', create_post, name='create_post'),
    path('account/update/', update_account, name='update_account'),
    path('posts/<int:post_id>/comments/', post_comments_api, name='post_comments'),
    path('comments/<int:comment_id>/pin/', pin_comment_api, name='pin_comment'),
    path('comments/<int:comment_id>/report/', report_comment_api, name='report_comment'),

    path('posts/<int:post_id>/report/', report_post_api, name='report_post'),
]