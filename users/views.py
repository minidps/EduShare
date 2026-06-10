from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

from .models import UserProfile


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
        return Response(
            {"error": "Username already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "Email already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    UserProfile.objects.create(
        user=user,
        grade=grade
    )

    refresh = RefreshToken.for_user(user)

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "grade": grade,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response(
            {"error": "Username and password are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(username=username, password=password)

    if user is None:
        return Response(
            {"error": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    profile = UserProfile.objects.get(user=user)

    refresh = RefreshToken.for_user(user)

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "grade": profile.grade,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    user = request.user
    profile = UserProfile.objects.get(user=user)

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "grade": profile.grade,
    }, status=status.HTTP_200_OK)