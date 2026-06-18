from typing import Any, Dict, List
from datetime import datetime, timezone

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db import models, transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from django.http import JsonResponse

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile, Grade, Subject, PostVote, Post, Comment


def serialize_grades(user: User) -> List[Dict[str, Any]]:
    return [
        {
            "subject": g.subject.name,
            "value": g.value
        }
        for g in Grade.objects.filter(user=user)
    ]


def serialize_votes(user: User) -> List[Dict[str, str]]:
    return [
        {
            "post_id": str(vote.post_id),  
            "value": 'up' if vote.value == PostVote.UPVOTE else 'down'
        }
        for vote in PostVote.objects.filter(user=user)
    ]


def get_user_grade(user: User) -> str:
    profile: UserProfile | None = UserProfile.objects.filter(user=user).first()
    return profile.grade if profile else ''


@api_view(['POST'])
def register(request: Request) -> Response:
    username: str | None = request.data.get('username')
    email: str | None = request.data.get('email')
    password: str | None = request.data.get('password')
    grade: str | None = request.data.get('grade')

    if not username or not email or not password or not grade:
        return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

    user: User = User.objects.create_user(username=username, email=email, password=password)
    UserProfile.objects.create(user=user, grade=grade)

    refresh: RefreshToken = RefreshToken.for_user(user)

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'username': user.username,
        'grade': grade
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def login_view(request: Request) -> Response:
    username_or_email: str | None = request.data.get('username') or request.data.get('email')
    password: str | None = request.data.get('password')

    if not username_or_email or not password:
        return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

    user: User | None = None
    if '@' in username_or_email:
        user = User.objects.filter(email=username_or_email).first()
    else:
        user = User.objects.filter(username=username_or_email).first()

    if user and user.check_password(password):
        refresh: RefreshToken = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'username': user.username,
            'grade': get_user_grade(user)
        }, status=status.HTTP_200_OK)

    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request: Request) -> Response:
    user: User = request.user
    refresh: RefreshToken = RefreshToken.for_user(user)

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "grade": get_user_grade(user),
        "grades": serialize_grades(user),
        "votes": serialize_votes(user),
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_grade(request: Request) -> Response:
    user: User = request.user
    subject_id: Any = request.data.get('subject_id')
    value: Any = request.data.get('value')

    if not subject_id or value is None:
        return Response({'error': 'subject_id and value are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        subject: Subject = Subject.objects.get(id=subject_id)
        grade_val: int = int(value)
    except (Subject.DoesNotExist, ValueError):
        return Response({'error': 'Invalid subject_id or grade value'}, status=status.HTTP_400_BAD_REQUEST)

    Grade.objects.create(user=user, subject=subject, value=grade_val)
    return Response({'success': 'Grade added successfully'}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vote_post(request: Request) -> Response:
    user: User = request.user
    post_id: Any = request.data.get('post_id')
    vote_type: str | None = request.data.get('value')

    if not post_id or not vote_type:
        return Response({'error': 'post_id and value are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        post: Post = Post.objects.get(id=int(post_id))
    except (Post.DoesNotExist, ValueError):
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    with transaction.atomic():
        existing_vote: PostVote | None = PostVote.objects.filter(user=user, post_id=str(post_id)).first()

        if vote_type == 'none':
            if existing_vote:
                if existing_vote.value == PostVote.UPVOTE:
                    post.upvotes = F('upvotes') - 1
                else:
                    post.downvotes = F('downvotes') - 1
                existing_vote.delete()
        elif vote_type == 'up':
            if existing_vote:
                if existing_vote.value == PostVote.DOWNVOTE:
                    post.downvotes = F('downvotes') - 1
                    post.upvotes = F('upvotes') + 1
                    existing_vote.value = PostVote.UPVOTE
                    existing_vote.save()
            else:
                post.upvotes = F('upvotes') + 1
                PostVote.objects.create(user=user, post_id=str(post_id), value=PostVote.UPVOTE)
        elif vote_type == 'down':
            if existing_vote:
                if existing_vote.value == PostVote.UPVOTE:
                    post.upvotes = F('upvotes') - 1
                    post.downvotes = F('downvotes') + 1
                    existing_vote.value = PostVote.DOWNVOTE
                    existing_vote.save()
            else:
                post.downvotes = F('downvotes') + 1
                PostVote.objects.create(user=user, post_id=str(post_id), value=PostVote.DOWNVOTE)

        post.save()
        
    post.refresh_from_db()
        
    return Response({'success': 'Vote updated successfully'}, status=status.HTTP_200_OK)


def get_time_ago(dt: datetime) -> str:
    if not dt:
        return ""
    now: datetime = datetime.now(timezone.utc)
    diff = now - dt

    if diff.days > 0:
        return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
    hours: int = diff.seconds // 3600
    if hours > 0:
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    minutes: int = diff.seconds // 60
    if minutes > 0:
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    return "Just now"


def serialize_post(post: Post) -> Dict[str, Any]:
    try:
        upvotes_count = int(post.upvotes)
        downvotes_count = int(post.downvotes)
    except TypeError:
        post.refresh_from_db()
        upvotes_count = post.upvotes
        downvotes_count = post.downvotes

    return {
        'id': str(post.id),  
        'title': post.title,
        'author': post.author.username,
        'avatar': post.author.username[0].upper() if post.author.username else 'U',
        'replies': post.replies,
        'views': post.views,
        'upvotes': upvotes_count - downvotes_count,
        'tags': post.tags if isinstance(post.tags, list) else [],
        'category': post.category,
        'timeAgo': get_time_ago(post.created_at),
        'description': post.description,
        'fileName': post.fileName,
    }


@api_view(['GET'])
def get_posts(request: Request) -> Response:
    try:
        posts = Post.objects.all().select_related('author').order_by('-created_at')
        serialized: List[Dict[str, Any]] = [serialize_post(post) for post in posts]
        return Response(serialized, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_account(request: Request) -> Response:
    user: User = request.user
    email: str | None = request.data.get('email')
    grade: str | None = request.data.get('grade')

    if email is not None and not email.strip():
        return Response({'error': 'Email cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
    if grade is not None and not grade.strip():
        return Response({'error': 'Grade cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)

    if email and email != user.email:
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
        user.email = email
        user.save()

    if grade:
        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.grade = grade
        profile.save()

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "grade": get_user_grade(user),
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request: Request) -> Response:
    try:
        title: str | None = request.data.get('title')
        description: str | None = request.data.get('description')
        category: str | None = request.data.get('category')
        tags: List[str] = request.data.get('tags', [])
        fileName: str | None = request.data.get('fileName')

        if not title or not description or not category:
            return Response(
                {'error': 'title, description, and category are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        post: Post = Post.objects.create(
            title=title,
            description=description,
            category=category,
            tags=tags,
            fileName=fileName,
            author=request.user
        )

        return Response(serialize_post(post), status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def serialize_comment(comment: Comment) -> Dict[str, Any]:
    username = comment.author.username if comment.author else 'Anonymous'
    return {
        "id": str(comment.id),
        "author": username,
        "avatar": username[0].upper() if username else '🎓',
        "text": comment.text,
        "timeAgo": get_time_ago(comment.created_at),
        "isPinned": getattr(comment, 'is_pinned', False)
    }


@api_view(['GET', 'POST'])
def post_comments_api(request: Request, post_id: int) -> Response:
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        comments = Comment.objects.filter(post=post).select_related('author').order_by('created_at')
        return Response([serialize_comment(c) for c in comments], status=status.HTTP_200_OK)

    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
            
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'error': 'Comment body cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            with transaction.atomic():
                new_comment = Comment.objects.create(
                    post=post,
                    author=request.user,
                    text=text
                )
                Post.objects.filter(id=post_id).update(replies=F('replies') + 1)
            
            return Response(serialize_comment(new_comment), status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': f'Failed to save comment: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pin_comment_api(request: Request, comment_id: int) -> Response:
    comment = get_object_or_404(Comment, id=comment_id)
    
    if comment.post.author != request.user:
        return Response({'error': 'Only the post author can pin comments.'}, status=status.HTTP_403_FORBIDDEN)
        
    comment.is_pinned = not getattr(comment, 'is_pinned', False)
    comment.save()
    return Response(serialize_comment(comment), status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def report_comment_api(request: Request, comment_id: int) -> Response:
    comment = get_object_or_404(Comment, id=comment_id)
    
    if hasattr(comment, 'is_reported'):
        comment.is_reported = True
        comment.save()
        
    return Response({'success': 'Comment reported successfully'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def report_post_api(request: Request, post_id: int) -> Response:
    post = get_object_or_404(Post, id=post_id)
    return Response({'success': 'Post thread reported successfully'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def report_post_api(request: Request, post_id: int) -> Response:
    post = get_object_or_404(Post, id=post_id)
    return Response({'success': 'Post thread reported successfully'}, status=status.HTTP_200_OK)