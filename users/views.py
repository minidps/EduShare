from django.contrib.auth.models import User
from django.contrib.auth import authenticate

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile, Grade, Subject, PostVote


def serialize_grades(user):
    return [
        {
            "subject": g.subject.name,
            "value": g.value
        }
        for g in Grade.objects.filter(user=user)
    ]


def serialize_votes(user):
    return [
        {
            "post_id": vote.post_id,
            "value": 'up' if vote.value == PostVote.UPVOTE else 'down'
        }
        for vote in PostVote.objects.filter(user=user)
    ]


def get_user_grade(user):
    profile = UserProfile.objects.filter(user=user).first()
    return profile.grade if profile else ''


@api_view(['POST'])
def register(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    grade = request.data.get('grade')

    if not username or not email or not password or not grade:
        return Response(
            {"error": "Username, email, password and grade are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({"error": "Email already exists"}, status=400)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    UserProfile.objects.create(user=user, grade=grade)

    refresh = RefreshToken.for_user(user)

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "grade": grade,
        "votes": [],
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }, status=201)


@api_view(['POST'])
def login_view(request):
    identifier = request.data.get('username') or request.data.get('email')
    password = request.data.get('password')

    if not identifier or not password:
        return Response(
            {"error": "Email/username and password are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = None
    if '@' in identifier:
        try:
            user = User.objects.get(email=identifier)
        except User.DoesNotExist:
            user = None
        if user and not user.check_password(password):
            user = None
    else:
        user = authenticate(username=identifier, password=password)

    if user is None:
        return Response(
            {"error": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    refresh = RefreshToken.for_user(user)

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "grade": get_user_grade(user),
        "grades": serialize_grades(user),
        "votes": serialize_votes(user),
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }, status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_grade(request):
    subject_id = request.data.get("subject_id")
    value = request.data.get("value")

    if not subject_id or value is None:
        return Response(
            {"error": "subject_id and value are required"},
            status=400
        )

    try:
        value = int(value)
    except:
        return Response({"error": "value must be a number"}, status=400)

    try:
        subject = Subject.objects.get(id=subject_id)
    except Subject.DoesNotExist:
        return Response({"error": "Subject not found"}, status=404)

    Grade.objects.create(
        user=request.user,
        subject=subject,
        value=value
    )

    return Response({"message": "Grade saved"}, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vote_post(request):
    post_id = request.data.get('post_id')
    value = request.data.get('value')

    if not post_id or value not in ('up', 'down', 'none'):
        return Response({"error": "post_id and value (up, down, none) are required"}, status=400)

    if value == 'none':
        PostVote.objects.filter(user=request.user, post_id=post_id).delete()
        return Response({"post_id": post_id, "value": None}, status=200)

    vote_value = PostVote.UPVOTE if value == 'up' else PostVote.DOWNVOTE
    vote, created = PostVote.objects.get_or_create(
        user=request.user,
        post_id=post_id,
        defaults={"value": vote_value}
    )
    if not created:
        vote.value = vote_value
        vote.save()

    return Response({"post_id": post_id, "value": 'up' if vote_value == PostVote.UPVOTE else 'down'}, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    user = request.user

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "grade": get_user_grade(user),
        "grades": serialize_grades(user),
        "votes": serialize_votes(user),
    }, status=200)