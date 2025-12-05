from django.contrib import admin
from .models import Area, Place, SavedPlace, Review

@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ["name", "description"]
    search_fields = ["name"]

@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    list_display = ("name", "area", "category", "average_rating")
    search_fields = ("name", "area__name")
    list_filter = ("category", "area")

@admin.register(SavedPlace)
class SavedPlaceAdmin(admin.ModelAdmin):
    list_display = ("traveler", "place", "saved_at")
    search_fields = ("traveler__user__username", "place__name")
    list_filter = ("saved_at",)

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("traveler", "place", "rating", "created_at")
    list_filter = ("rating", "created_at")
    search_fields = ("traveler__user__username", "place__name", "title", "text")
