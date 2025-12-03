from django.conf import settings
from django.db import models

class Category(models.TextChoices):
    PLACE = "place", "Place"
    RESTAURANT = "restaurant", "Restaurant"
    MALL = "mall", "Mall"

class Tag(models.TextChoices):
    TOP_RATED = "top_rated", "Top Rated"
    POPULAR = "popular", "Popular"
    LOCAL = "local", "Local"
    HERITAGE = "heritage", "Heritage"

class Destination(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=Category.choices)
    tags = models.CharField(
        max_length=100,
        blank=True,
        help_text="Comma separated: top_rated,popular,local,heritage",
    )
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    image_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    @property
    def avg_rating(self):
        agg = self.reviews.aggregate(models.Avg("rating"))
        return agg["rating__avg"] or 0.0

    @property
    def review_count(self):
        return self.reviews.count()

    def has_tag(self, tag_value: str) -> bool:
        if not self.tags:
            return False
        return tag_value in [t.strip() for t in self.tags.split(",")]

class Review(models.Model):
    destination = models.ForeignKey(
        Destination,
        related_name="reviews",
        on_delete=models.CASCADE,
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.DecimalField(max_digits=2, decimal_places=1)  # 1.0 to 5.0
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} -> {self.destination} ({self.rating})"

