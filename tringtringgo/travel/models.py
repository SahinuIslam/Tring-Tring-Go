from django.db import models
from django.contrib.auth.models import User
from accounts.models import UserAccount

class Place(models.Model):
    CATEGORY_CHOICES = [
        ("PARK", "Park"),
        ("MUSEUM", "Museum"),
        ("RESTAURANT", "Restaurant"),
        ("CAFE", "Cafe"),
        ("MALL", "Mall"),
        ("LAKE", "Lake"),
        ("STREET_FOOD", "Street Food"),
        ("OTHER", "Other"),
    ]

    name = models.CharField(max_length=120)
    area = models.CharField(max_length=120, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="OTHER")
    image_url = models.URLField(blank=True)
    average_rating = models.FloatField(default=0.0)

    def __str__(self):
        return f"{self.name} ({self.area})"


class SavedPlace(models.Model):
    traveler = models.ForeignKey(
        UserAccount,
        on_delete=models.CASCADE,
        related_name="saved_places",
        limit_choices_to={"role": "TRAVELER"},
    )
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name="saved_by")
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("traveler", "place")

    def __str__(self):
        return f"{self.traveler.user.username} saved {self.place.name}"




class Review(models.Model):
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]

    traveler = models.ForeignKey(
        UserAccount,
        on_delete=models.CASCADE,
        related_name="reviews",
        limit_choices_to={"role": "TRAVELER"},
    )
    place = models.ForeignKey(
        Place,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    rating = models.IntegerField(choices=RATING_CHOICES)
    title = models.CharField(max_length=120, blank=True)
    text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.traveler.user.username} → {self.place.name} ({self.rating})"
