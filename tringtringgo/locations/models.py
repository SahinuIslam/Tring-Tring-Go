from django.db import models

class Area(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField()
    
    image = models.ImageField(upload_to='areas/', null=True, blank=True)
    
    # Area characteristics
    is_historic = models.BooleanField(default=False)
    is_residential = models.BooleanField(default=False)
    is_commercial = models.BooleanField(default=False)
    
    # Display information
    average_rating = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    community_post_count = models.PositiveIntegerField(default=0)
    
    # Best time to visit information
    best_time_start = models.TimeField(null=True, blank=True)
    best_time_end = models.TimeField(null=True, blank=True)
    avoid_time_start = models.TimeField(null=True, blank=True)
    avoid_time_end = models.TimeField(null=True, blank=True)
    avoid_reason = models.CharField(max_length=200, blank=True)
    
    emergency_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name