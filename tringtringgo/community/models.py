from django.db import models
from accounts.models import UserAccount
from locations.models import Area
from places.models import Place

class CommunityPost(models.Model):
    POST_TYPES = [
        ("PRICE_ALERT", "Price Alert"),
        ("TRAFFIC", "Traffic Update"),
        ("FOOD_TIP", "Food Tip"),
        ("GENERAL", "General Post"),
    ]
    
    author = models.ForeignKey(UserAccount, on_delete=models.CASCADE, related_name='posts')
    post_type = models.CharField(max_length=20, choices=POST_TYPES)
    
    title = models.CharField(max_length=200)
    content = models.TextField()
    
    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name='posts', null=True, blank=True)
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='posts', null=True, blank=True)
    
    helpful_count = models.PositiveIntegerField(default=0)
    comment_count = models.PositiveIntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} by {self.author.user.username}"

class PostComment(models.Model):
    post = models.ForeignKey(CommunityPost, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(UserAccount, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.author.user.username} on {self.post.title}"