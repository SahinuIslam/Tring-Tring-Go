from django.db import models
from accounts.models import UserAccount


class Post(models.Model):
    POST_TYPES = [
        ('PRICE_ALERT', 'Price Alert'),
        ('TRAFFIC_UPDATE', 'Traffic Update'),
        ('FOOD_TIP', 'Food Tip'),
    ]

    user_account = models.ForeignKey(
        UserAccount, 
        on_delete=models.CASCADE, 
        related_name='posts'
    )
    title = models.CharField(max_length=500)
    content = models.TextField()
    area = models.CharField(max_length=200)
    post_type = models.CharField(max_length=20, choices=POST_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']  # Most recent posts first

    def __str__(self):
        return f"{self.title} - {self.area}"


class SavedItem(models.Model):
    user_account = models.ForeignKey(
        UserAccount, 
        on_delete=models.CASCADE, 
        related_name='saved_items'
    )
    post = models.ForeignKey(
        Post, 
        on_delete=models.CASCADE, 
        related_name='saved_items'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user_account', 'post')  # A user can only save a post once

    def __str__(self):
        return f"{self.user_account.user.username} saved {self.post.title}"