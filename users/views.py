from typing import Any, Dict, List
from datetime import datetime, timezone

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db import models, transaction  # Added transaction module
from django.db.models import F

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile, Grade, Subject, PostVote, Post


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
            "post_id": vote.post_id,
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
    post_id: str | None = request.data.get('post_id')
    vote_type: str | None = request.data.get('value')  # 'up', 'down', 'none'

    if not post_id or not vote_type:
        return Response({'error': 'post_id and value are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        post: Post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_444_NOT_FOUND if status.HTTP_404_NOT_FOUND else status.HTTP_404_NOT_FOUND)

    # Wrapped in a transaction block to safely modify multi-model data states securely
    with transaction.atomic():
        existing_vote: PostVote | None = PostVote.objects.filter(user=user, post_id=post_id).first()

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
                PostVote.objects.create(user=user, post_id=post_id, value=PostVote.UPVOTE)
        elif vote_type == 'down':
            if existing_vote:
                if existing_vote.value == PostVote.UPVOTE:
                    post.upvotes = F('upvotes') - 1
                    post.downvotes = F('downvotes') + 1
                    existing_vote.value = PostVote.DOWNVOTE
                    existing_vote.save()
            else:
                post.downvotes = F('downvotes') + 1
                PostVote.objects.create(user=user, post_id=post_id, value=PostVote.DOWNVOTE)

        post.save()
        
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
    # Note: If F() objects were evaluated recently on this post instance, 
    # we use standard subtraction safely by making sure the integers are fresh.
    try:
        upvotes_count = int(post.upvotes)
        downvotes_count = int(post.downvotes)
    except TypeError:
        # Falls back gracefully or re-fetches field values if F() objects exist on instance
        post.refresh_from_db()
        upvotes_count = post.upvotes
        downvotes_count = post.downvotes

    return {
        'id': int(post.id),  # Kept as Integer to match traditional primary key formats
        'title': post.title,
        'author': post.author.username,
        'avatar': post.author.username[0].upper() if post.author.username else 'U',
        'replies': post.replies,
        'views': post.views,
        'upvotes': upvotes_count - downvotes_count,  # Net calculation
        'tags': post.tags if isinstance(post.tags, list) else [],
        'category': post.category,
        'timeAgo': get_time_ago(post.created_at),
        'description': post.description,
        'fileName': post.fileName,
    }


@api_view(['GET'])
def get_posts(request: Request) -> Response:
    try:
        # Added .select_related('author') to prevent N+1 overhead queries
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