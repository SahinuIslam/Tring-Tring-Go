from django.contrib import admin
from .models import Destination, Review

@admin.register(Destination)
class DestinationAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "city", "country")
    search_fields = ("name", "city", "country")

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("destination", "user", "rating", "created_at")
    search_fields = ("destination__name", "user__username")
