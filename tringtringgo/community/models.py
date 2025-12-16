from django.db import models
from accounts.models import UserAccount
from travel.models import Area


class CommunityPost(models.Model):
    CATEGORY_CHOICES = [
        ("PRICE_ALERT", "Price Alert"),
        ("TRAFFIC", "Traffic"),
        ("FOOD_TIPS", "Food Tips"),
        ("LOST_FOUND", "Lost & Found"),
    ]

    author = models.ForeignKey(
        UserAccount,
        on_delete=models.CASCADE,
        related_name="community_posts",
    )
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    area = models.ForeignKey(
        Area,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="community_posts",
    )
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    # cached counters for fast feed
    comments_count = models.PositiveIntegerField(default=0)
    likes_count = models.PositiveIntegerField(default=0)
    dislikes_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"


class CommunityComment(models.Model):
    post = models.ForeignKey(
        CommunityPost,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    author = models.ForeignKey(
        UserAccount,
        on_delete=models.CASCADE,
        related_name="community_comments",
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment by {self.author.user.username} on {self.post.id}"


class CommunityReaction(models.Model):
    REACTION_CHOICES = [
        ("LIKE", "Like"),
        ("DISLIKE", "Dislike"),
    ]

    post = models.ForeignKey(
        CommunityPost,
        on_delete=models.CASCADE,
        related_name="reactions",
    )
    user = models.ForeignKey(
        UserAccount,
        on_delete=models.CASCADE,
        related_name="community_reactions",
    )
    reaction = models.CharField(max_length=7, choices=REACTION_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("post", "user")

    def __str__(self):
        return f"{self.user.user.username} {self.reaction} {self.post.id}"
