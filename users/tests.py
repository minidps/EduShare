from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import timedelta

from .models import UserProfile, Subject, Grade, PostVote, Post, Comment
from .views import get_time_ago, serialize_post


class AuthenticationAndUserTests(APITestCase):
    def setUp(self):
        self.register_url = '/register/'
        self.login_url = '/login/'
        self.me_url = '/me/'
        
        self.user_data = {
            "username": "testuser",
            "email": "testuser@example.com",
            "password": "securepassword123",
            "grade": "11th Grade"
        }
        
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
        
        self.assertTrue(UserProfile.objects.filter(user__username="testuser").exists())

    def test_register_missing_fields(self):
        incomplete_data = {"username": "baduser"}
        response = self.client.post(self.register_url, incomplete_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_register_duplicate_username_or_email(self):
        bad_data = self.user_data.copy()
        bad_data["username"] = "existinguser"
        response = self.client.post(self.register_url, bad_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
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
        # 💡 Fixed url targeting to point directly to your configured grades endpoint routes
        self.add_grade_url = '/grades/add/'
        self.user = User.objects.create_user(username="student", password="password")
        self.subject = Subject.objects.create(name="Mathematics")
        
        self.refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.refresh.access_token}')

    def test_add_grade_success(self):
        payload = {"subject_id": self.subject.id, "value": 95}
        response = self.client.post(self.add_grade_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Grade.objects.filter(user=self.user, value=95).exists())

    def test_add_grade_validation_errors(self):
        # Missing payload
        response = self.client.post(self.add_grade_url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Non-numeric value
        payload = {"subject_id": self.subject.id, "value": "not-a-number"}
        response = self.client.post(self.add_grade_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Subject not found
        payload = {"subject_id": 9999, "value": 80}
        response = self.client.post(self.add_grade_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ForumAndVotingTests(APITestCase):
    def setUp(self):
        self.vote_url = '/posts/vote/'
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
        
        payload = {"post_id": str(self.post.id), "value": "up"}
        response = self.client.post(self.vote_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(PostVote.objects.get(user=self.user, post_id=str(self.post.id)).value, PostVote.UPVOTE)
        
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


# 💡 NEW TEST CLASS: Covering Comments, Pinning, and Reports
class CommentAndInteractionTests(APITestCase):
    def setUp(self):
        self.post_author = User.objects.create_user(username="post_owner", password="password")
        self.commenter = User.objects.create_user(username="commenter", password="password")
        
        self.post = Post.objects.create(
            title="Interactive Thread",
            author=self.post_author,
            description="Testing comment updates",
            category="General",
            replies=0
        )
        
        self.comment = Comment.objects.create(
            post=self.post,
            author=self.commenter,
            text="Initial feedback comment text."
        )
        
        self.comments_url = f'/posts/{self.post.id}/comments/'
        self.pin_url = f'/comments/{self.comment.id}/pin/'
        self.report_url = f'/comments/{self.comment.id}/report/'

    def test_get_comments(self):
        response = self.client.get(self.comments_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['text'], "Initial feedback comment text.")

    def test_post_comment_success(self):
        refresh = RefreshToken.for_user(self.commenter)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        payload = {"text": "This is a brand new response!"}
        response = self.client.post(self.comments_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["text"], payload["text"])
        
        # Verify replies counter incremented on parent post
        self.post.refresh_from_db()
        self.assertEqual(self.post.replies, 1)

    def test_post_comment_unauthenticated(self):
        payload = {"text": "Anonymous text block"}
        response = self.client.post(self.comments_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_pin_comment_by_post_author(self):
        refresh = RefreshToken.for_user(self.post_author)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = self.client.post(self.pin_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["isPinned"])
        
        # Unpin toggle validation
        response = self.client.post(self.pin_url)
        self.assertFalse(response.data["isPinned"])

    def test_pin_comment_by_non_author_forbidden(self):
        refresh = RefreshToken.for_user(self.commenter)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = self.client.post(self.pin_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_report_comment_authenticated(self):
        refresh = RefreshToken.for_user(self.commenter)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = self.client.post(self.report_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("success", response.data)


class UtilityMethodTests(APITestCase):
    def test_get_time_ago_intervals(self):
        now = timezone.now()
        
        self.assertEqual(get_time_ago(now - timedelta(seconds=15)), 'Just now')
        self.assertEqual(get_time_ago(now - timedelta(minutes=5)), '5 minutes ago')
        self.assertEqual(get_time_ago(now - timedelta(minutes=1)), '1 minute ago')
        self.assertEqual(get_time_ago(now - timedelta(hours=3)), '3 hours ago')
        self.assertEqual(get_time_ago(now - timedelta(hours=1)), '1 hour ago')
        self.assertEqual(get_time_ago(now - timedelta(days=4)), '4 days ago')
        self.assertEqual(get_time_ago(now - timedelta(days=1)), '1 day ago')