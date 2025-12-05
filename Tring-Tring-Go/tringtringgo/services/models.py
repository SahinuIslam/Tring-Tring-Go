from django.db import models
from locations.models import Area

class Service(models.Model):
    SERVICE_TYPES = [
        ("HOSPITAL", "Hospital"),
        ("ATM", "ATM"),
        ("BANK", "Bank"),
        ("PHARMACY", "Pharmacy"),
        ("POLICE", "Police Station"),
        ("FIRE", "Fire Station"),
        ("OTHER", "Other"),
    ]
    
    name = models.CharField(max_length=200)
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPES)
    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name='services')
    
    address = models.TextField()
    phone = models.CharField(max_length=20, blank=True)
    
    operating_hours = models.CharField(max_length=100, blank=True)
    is_24_7 = models.BooleanField(default=False)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['service_type', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.service_type})"