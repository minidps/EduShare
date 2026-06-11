from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import timedelta

from .models import UserProfile, Subject, Grade, PostVote, Post
from .views import get_time_ago, serialize_post


class AuthenticationAndUserTests(APITestCase):
    def setUp(self):
        # Create a test user profile setup
        self.register_url = '/register/'
        self.login_url = '/login/'
        self.me_url = '/me/'
        
        self.user_data = {
            "username": "testuser",
            "email": "testuser@example.com",
            "password": "securepassword123",
            "grade": "11th Grade"
        }
        
        # Pre-populate a user for login/me tests
        self.existing_user = User.objects.create_user(
            username="existinguser",
            email="existing@example.com",
            password="existingpassword"
        )
        self.existing_profile = UserProfile.objects.create(
            user=self.existing_user, 
            grade="12th Grade"
        )

    def test_register_user_success(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["username"], self.user_data["username"])
        self.assertEqual(response.data["grade"], self.user_data["grade"])
        
        # Verify DB entry
        self.assertTrue(UserProfile.objects.filter(user__username="testuser").exists())

    def test_register_missing_fields(self):
        incomplete_data = {"username": "baduser"}
        response = self.client.post(self.register_url, incomplete_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_register_duplicate_username_or_email(self):
        # Username exists
        bad_data = self.user_data.copy()
        bad_data["username"] = "existinguser"
        response = self.client.post(self.register_url, bad_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Email exists
        bad_data = self.user_data.copy()
        bad_data["email"] = "existing@example.com"
        response = self.client.post(self.register_url, bad_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_with_username_success(self):
        login_data = {"username": "existinguser", "password": "existingpassword"}
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertEqual(response.data["grade"], "12th Grade")

    def test_login_with_email_success(self):
        login_data = {"email": "existing@example.com", "password": "existingpassword"}
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_invalid_credentials(self):
        login_data = {"username": "existinguser", "password": "wrongpassword"}
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_current_user_authenticated(self):
        refresh = RefreshToken.for_user(self.existing_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "existinguser")

    def test_get_current_user_unauthenticated(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class GradeTests(APITestCase):
    def setUp(self):
        self.add_grade_url = '/posts/'  # Notice: add_grade shares no path in urls.py, but assuming it binds correctly
        # Let's override to dynamically verify view if custom router paths exist
        self.user = User.objects.create_user(username="student", password="password")
        self.subject = Subject.objects.create(name="Mathematics")
        
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_add_grade_success(self):
        # Directly calling the view flow using a manual test request since url mapping is absent for add_grade in urls.py
        from .views import add_grade
        from rest_framework.test import APIRequestFactory
        
        factory = APIRequestFactory()
        request = factory.post('/add-grade/', {"subject_id": self.subject.id, "value": 95}, format='json')
        from rest_framework.test import force_authenticate
        force_authenticate(request, user=self.user)
        
        response = add_grade(request)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Grade.objects.filter(user=self.user, value=95).exists())

    def test_add_grade_validation_errors(self):
        from .views import add_grade
        from rest_framework.test import APIRequestFactory
        factory = APIRequestFactory()
        
        # Missing payload
        request = factory.post('/add-grade/', {}, format='json')
        from rest_framework.test import force_authenticate
        force_authenticate(request, user=self.user)
        response = add_grade(request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Non-numeric value
        request = factory.post('/add-grade/', {"subject_id": self.subject.id, "value": "not-a-number"}, format='json')
        force_authenticate(request, user=self.user)
        response = add_grade(request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Subject not found
        request = factory.post('/add-grade/', {"subject_id": 9999, "value": 80}, format='json')
        force_authenticate(request, user=self.user)
        response = add_grade(request)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ForumAndVotingTests(APITestCase):
    def setUp(self):
        self.vote_url = '/vote/'
        self.posts_url = '/posts/'
        self.create_post_url = '/posts/create/'
        
        self.user = User.objects.create_user(username="author_user", password="password125")
        self.refresh = RefreshToken.for_user(self.user)
        
        self.post = Post.objects.create(
            title="Django Setup Guide",
            author=self.user,
            description="Learn how to configure Django.",
            category="Computer Science",
            tags=["django", "python"],
            upvotes=10,
            downvotes=2
        )

    def test_get_posts_list(self):
        response = self.client.get(self.posts_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], "Django Setup Guide")
        # Net balance calculation assertion (upvotes - downvotes)
        self.assertEqual(response.data[0]['upvotes'], 8)

    def test_create_post_success(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.refresh.access_token}')
        payload = {
            "title": "New Chemistry Notes",
            "description": "Organic chemistry reaction maps.",
            "category": "Chemistry",
            "tags": ["organic", "hexanes"]
        }
        response = self.client.post(self.create_post_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Post.objects.filter(title="New Chemistry Notes").count(), 1)

    def test_create_post_missing_required_fields(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.refresh.access_token}')
        payload = {"title": "Missing details"}
        response = self.client.post(self.create_post_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_vote_post_upvote_and_change_vote(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.refresh.access_token}')
        
        # Cast Upvote
        payload = {"post_id": str(self.post.id), "value": "up"}
        response = self.client.post(self.vote_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(PostVote.objects.get(user=self.user, post_id=str(self.post.id)).value, PostVote.UPVOTE)
        
        # Shift to Downvote
        payload["value"] = "down"
        response = self.client.post(self.vote_url, payload, format='json')
        self.assertEqual(PostVote.objects.get(user=self.user, post_id=str(self.post.id)).value, PostVote.DOWNVOTE)

    def test_vote_post_remove_vote(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.refresh.access_token}')
        PostVote.objects.create(user=self.user, post_id=str(self.post.id), value=PostVote.UPVOTE)
        
        payload = {"post_id": str(self.post.id), "value": "none"}
        response = self.client.post(self.vote_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(PostVote.objects.filter(user=self.user, post_id=str(self.post.id)).exists())


class UtilityMethodTests(APITestCase):
    def test_get_time_ago_intervals(self):
        now = timezone.now()
        
        # Just now
        self.assertEqual(get_time_ago(now - timedelta(seconds=15)), 'Just now')
        
        # Minutes
        self.assertEqual(get_time_ago(now - timedelta(minutes=5)), '5 minutes ago')
        self.assertEqual(get_time_ago(now - timedelta(minutes=1)), '1 minute ago')
        
        # Hours
        self.assertEqual(get_time_ago(now - timedelta(hours=3)), '3 hours ago')
        self.assertEqual(get_time_ago(now - timedelta(hours=1)), '1 hour ago')
        
        # Days
        self.assertEqual(get_time_ago(now - timedelta(days=4)), '4 days ago')
        self.assertEqual(get_time_ago(now - timedelta(days=1)), '1 day ago')