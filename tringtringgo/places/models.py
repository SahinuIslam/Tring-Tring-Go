from django.db import models
from accounts.models import UserAccount, MerchantProfile
from locations.models import Area

class Place(models.Model):
    PLACE_TYPES = [
        ("RESTAURANT", "Restaurant"),
        ("CAFE", "Cafe"),
        ("SHOP", "Shop"),
        ("MALL", "Mall"),
        ("LANDMARK", "Landmark"),
        ("PARK", "Park"),
        ("MOSQUE", "Mosque"),
        ("MARKET", "Market"),
        ("STREET_FOOD", "Street Food Spot"),
        ("OTHER", "Other"),
    ]
    
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    place_type = models.CharField(max_length=20, choices=PLACE_TYPES)
    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name='places')
    
    description = models.TextField()
    address = models.TextField(blank=True)
    
    merchant = models.ForeignKey(
        MerchantProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='places'
    )
    
    average_rating = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    review_count = models.PositiveIntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.area.name})"

class SavedPlace(models.Model):
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE, related_name='saved_places')
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='saved_by')
    saved_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'place']
        ordering = ['-saved_at']
    
    def __str__(self):
        return f"{self.user.user.username} saved {self.place.name}"