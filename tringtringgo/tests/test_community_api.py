# community/tests/test_community_api.py
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import UserAccount, AdminProfile
from travel.models import Area
from community.models import CommunityPost, CommunityComment, CommunityReaction

class CommunityApiTests(APITestCase):
    def setUp(self):
        # area
        self.area = Area.objects.create(name="Dhanmondi")

        # traveler user
        self.traveler_user = User.objects.create_user(username="traveler1", password="pass")
        self.traveler_account = UserAccount.objects.create(
            user=self.traveler_user,
            role="TRAVELER",
        )

        # admin user
        self.admin_user = User.objects.create_user(username="admin1", password="pass")
        self.admin_account = UserAccount.objects.create(
            user=self.admin_user,
            role="ADMIN",
        )
        self.admin_profile = AdminProfile.objects.create(
            account=self.admin_account,
            area=self.area,
        )

        # existing post
        self.post = CommunityPost.objects.create(
            author=self.traveler_account,
            title="Test Post",
            category="GENERAL",  # adapt to your real choice key
            area=self.area,
            description="Hello",
        )

    def _auth_headers_for(self, user, mode):
        # your get_*_from_token uses username as token
        return {
            "HTTP_X_USER_TOKEN": user.username,
            "HTTP_X_USER_MODE": mode,
        }

    def test_traveler_can_create_post(self):
        url = reverse("community-posts")  # name for community_posts view
        data = {
            "title": "New Post",
            "category": "GENERAL",
            "area_id": self.area.id,
            "description": "Some text",
        }
        headers = self._auth_headers_for(self.traveler_user, "TRAVELER")
        resp = self.client.post(url, data, format="json", **headers)

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["title"], "New Post")
        self.assertEqual(resp.data["area_id"], self.area.id)

    def test_non_traveler_cannot_create_post(self):
        url = reverse("community-posts")
        data = {
            "title": "Bad Post",
            "category": "GENERAL",
            "area_id": self.area.id,
            "description": "Some text",
        }
        headers = self._auth_headers_for(self.admin_user, "ADMIN")
        resp = self.client.post(url, data, format="json", **headers)

        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Traveler access only", resp.data["detail"])

    def test_admin_area_posts_only_own_area(self):
        url = reverse("admin-area-posts")  # name for admin_area_posts view
        headers = {"HTTP_X_USER_TOKEN": self.admin_user.username}
        resp = self.client.get(url, **headers)

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["id"], self.post.id)

    def test_admin_can_delete_post_in_area(self):
        url = reverse("admin-delete-post", args=[self.post.id])
        headers = {"HTTP_X_USER_TOKEN": self.admin_user.username}
        resp = self.client.delete(url, **headers)

        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CommunityPost.objects.filter(id=self.post.id).exists())

