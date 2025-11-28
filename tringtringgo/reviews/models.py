from django.db import models
from accounts.models import UserAccount
from places.models import Place

class Review(models.Model):
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='reviews')
    author = models.ForeignKey(UserAccount, on_delete=models.CASCADE, related_name='reviews')
    
    rating = models.PositiveSmallIntegerField(choices=[(i, i) for i in range(1, 6)])
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    
    helpful_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['place', 'author']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.rating} {self.title or 'Review'} for {self.place.name}"