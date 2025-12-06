from django.db import models
from django.contrib.auth.models import User
from accounts.models import MerchantProfile

# Area Model
class Area(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

# Place Model
class Place(models.Model):
    CATEGORY_CHOICES = [
        ("PARK", "Park"),
        ("MUSEUM", "Museum"),
        ("RESTAURANT", "Restaurant"),
        ("CAFE", "Cafe"),
        ("STREET_FOOD", "Street Food"),
        ("FAST_FOOD", "Fast Food"),
        ("BAKERY", "Bakery"),
        ("MALL", "Mall"),
        ("SHOP", "Shop"),
        ("LOCAL_MARKET", "Local Market"),
        ("SUPERMARKET", "Supermarket"),
        ("HISTORICAL_SITE", "Historical Site"),
        ("LANDMARK", "Landmark"),
        ("LAKE", "Lake"),
        ("BEACH", "Beach"),
        ("ZOO", "Zoo"),
        ("CINEMA", "Cinema"),
        ("AMUSEMENT_PARK", "Amusement Park"),
        ("SPORTS_COMPLEX", "Sports Complex"),
        ("HOTEL", "Hotel"),
        ("GUEST_HOUSE", "Guest House"),
        ("TRANSPORT", "Transport Hub"),
        ("OTHER", "Other"),
    ]

    name = models.CharField(max_length=120)

    # which area this place belongs to
    area = models.ForeignKey(
        Area,
        on_delete=models.CASCADE,
        related_name="places",
        null=True,
        blank=True,
    )

    # high-level type used for Explore filters
    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES,
        default="OTHER",
    )

    image_url = models.URLField(blank=True)

    # stored copy of average rating for fast queries (computed from Review)
    average_rating = models.FloatField(default=0.0)

    # OPTIONAL: which merchant owns this place (restaurant, cafe, shop, etc.)
    owner = models.ForeignKey(
        MerchantProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="places",
    )

    def __str__(self):
        area_name = self.area.name if self.area else "No area"
        return f"{self.name} ({area_name})"

# Saved Place Model
class SavedPlace(models.Model):
    traveler = models.ForeignKey(
        "accounts.UserAccount",     
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

# Review Model
class Review(models.Model):
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]

    traveler = models.ForeignKey(
        "accounts.UserAccount",     
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
