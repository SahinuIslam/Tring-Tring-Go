from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL


class ChatThread(models.Model):
    """
    Ekta chat session: 2 or beshi participant + status.
    Example: traveler ↔ merchant, or user ↔ admin.
    """
    participants = models.ManyToManyField(User, related_name="chat_threads")
    created_at = models.DateTimeField(auto_now_add=True)

    # request/accept system
    PENDING = "pending"
    ACTIVE = "active"
    CLOSED = "closed"

    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (ACTIVE, "Active"),
        (CLOSED, "Closed"),
    ]

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default=PENDING,
    )

    # kto ke request pathaise, jate "X wants to chat" dekhate pari
    requested_by = models.ForeignKey(
        User,
        related_name="chat_requests_sent",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"Thread {self.id} ({self.status})"


class ChatMessage(models.Model):
    """
    Thread er moddhe msgs: sender, text, seen status.
    """
    thread = models.ForeignKey(
        ChatThread,
        related_name="messages",
        on_delete=models.CASCADE,
    )
    sender = models.ForeignKey(
        User,
        related_name="chat_messages_sent",
        on_delete=models.CASCADE,
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Msg {self.id} in Thread {self.thread_id}"
