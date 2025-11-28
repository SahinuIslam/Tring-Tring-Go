from django.contrib import admin
from .models import Review

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("place", "author", "rating", "helpful_count", "created_at")
    list_filter = ("rating",)
    search_fields = ("content", "author__user__username", "place__name")
    readonly_fields = ("created_at",)
    list_select_related = ("place", "author")