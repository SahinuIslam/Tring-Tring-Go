# chat/tests/test_chat_api.py
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from chat.models import ChatThread, ChatMessage  # adjust to your app name

User = get_user_model()


class ChatApiTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username="u1", password="pass")
        self.user2 = User.objects.create_user(username="u2", password="pass")

        # existing active thread between user1 and user2
        self.thread = ChatThread.objects.create(
            requested_by=self.user1,
            status=ChatThread.ACTIVE,
        )
        self.thread.participants.add(self.user1, self.user2)

        ChatMessage.objects.create(
            thread=self.thread,
            sender=self.user1,
            text="hello",
        )

    def _headers_for(self, user):
        # your get_user_from_token reads X-User-Token
        return {"HTTP_X_USER_TOKEN": user.username}

    def test_thread_list_requires_auth(self):
        url = reverse("chat-thread-list")  # ChatThreadListView URL name
        resp = self.client.get(url)  # no header

        # get_user_from_token returns None -> queryset.none -> empty list, 200
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data, [])

    def test_thread_list_returns_user_threads(self):
        url = reverse("chat-thread-list")
        resp = self.client.get(url, **self._headers_for(self.user1))

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["id"], self.thread.id)

    def test_request_thread_creates_or_reuses(self):
        url = reverse("chat-thread-request")  # ChatThreadRequestView URL name
        data = {"user_id": self.user2.id}

        resp = self.client.post(url, data, format="json", **self._headers_for(self.user1))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", resp.data)
        self.assertEqual(
            set(resp.data["participants"]),
            {self.user1.id, self.user2.id},
        )

    def test_request_thread_self_chat_forbidden(self):
        url = reverse("chat-thread-request")
        data = {"user_id": self.user1.id}

        resp = self.client.post(url, data, format="json", **self._headers_for(self.user1))
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cannot start a chat with yourself", resp.data["detail"].lower())

    def test_accept_thread_changes_status(self):
        # make a pending thread
        pending = ChatThread.objects.create(
            requested_by=self.user1,
            status=ChatThread.PENDING,
        )
        pending.participants.add(self.user1, self.user2)

        url = reverse("chat-thread-accept", args=[pending.id])
        data = {"action": "accept"}

        resp = self.client.post(url, data, format="json", **self._headers_for(self.user2))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        pending.refresh_from_db()
        self.assertEqual(pending.status, ChatThread.ACTIVE)

    def test_message_list_and_create(self):
        url = reverse("chat-message-list", args=[self.thread.id])
        # list
        resp = self.client.get(url, **self._headers_for(self.user1))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["text"], "hello")

        # create
        data = {"text": "hi back"}
        resp2 = self.client.post(url, data, format="json", **self._headers_for(self.user2))
        self.assertEqual(resp2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp2.data["text"], "hi back")
        self.assertEqual(ChatMessage.objects.filter(thread=self.thread).count(), 2)
