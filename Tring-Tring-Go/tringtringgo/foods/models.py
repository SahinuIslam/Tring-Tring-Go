from django.db import models
from accounts.models import UserAccount
from locations.models import Area
from places.models import Place

class FoodItem(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    
    place = models.ForeignKey(
        Place,
        on_delete=models.CASCADE,
        related_name='food_items',
        null=True,
        blank=True
    )
    
    area = models.ForeignKey(
        Area,
        on_delete=models.CASCADE,
        related_name='food_items',
        null=True,
        blank=True
    )
    
    standard_price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='foods/', null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        location = self.place.name if self.place else self.area.name if self.area else "General"
        return f"{self.name} ({location})"

class PriceUpdate(models.Model):
    STATUS_CHOICES = [
        ("FAIR", "Fair"),
        ("HIGH", "High"),
        ("LOW", "Low"),
    ]
    
    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE, related_name='price_updates')
    updated_by = models.ForeignKey(UserAccount, on_delete=models.CASCADE, related_name='price_updates')
    
    current_price = models.DecimalField(max_digits=10, decimal_places=2)
    price_status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    
    confirmation_count = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.food_item.name}: ৳{self.current_price} ({self.price_status})"