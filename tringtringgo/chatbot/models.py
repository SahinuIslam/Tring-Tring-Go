from django.db import models

class Place(models.Model):
    name = models.CharField(max_length=200)
    area = models.CharField(max_length=200, blank=True)
    rating = models.FloatField(default=0.0)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.rating})"

class Hospital(models.Model):
    name = models.CharField(max_length=200)
    area = models.CharField(max_length=200, blank=True)
    def __str__(self):
        return self.name

class PoliceStation(models.Model):
    name = models.CharField(max_length=200)
    area = models.CharField(max_length=200, blank=True)
    def __str__(self):
        return self.name

class ATM(models.Model):
    name = models.CharField(max_length=200)
    area = models.CharField(max_length=200, blank=True)
    def __str__(self):
        return self.name
    
class Pharmacies(models.Model):
    name = models.CharField(max_length=200)
    area = models.CharField(max_length=200, blank=True)
    def __str__(self):
        return self.name
    
class Transport(models.Model):
    name = models.CharField(max_length=200)
    area = models.CharField(max_length=200, blank=True)
    def __str__(self):
        return self.name
    
class ChatMessage(models.Model):
    ROLE_CHOICES = (('user','user'), ('bot','bot'))
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.role}: {self.message[:40]}"
