from django.contrib.auth.models import User
from django.contrib.auth import authenticate

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile, Grade, Subject


def serialize_grades(user):
    return [
        {
            "subject": g.subject.name,
            "value": g.value
        }
        for g in Grade.objects.filter(user=user)
    ]


@api_view(['POST'])
def register(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if not username or not email or not password:
        return Response(
            {"error": "Username, email and password are required"},
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

    UserProfile.objects.create(user=user)

    refresh = RefreshToken.for_user(user)

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }, status=201)


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

    refresh = RefreshToken.for_user(user)

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "grades": serialize_grades(user),
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
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    user = request.user

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "grades": serialize_grades(user),
    }, status=200)