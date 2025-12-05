from django.contrib import admin
from .models import Place, SavedPlace

@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    list_display = ("name", "place_type", "area", "merchant", "average_rating", "is_active")
    list_filter = ("place_type", "area", "is_active")
    search_fields = ("name",)
    readonly_fields = ("created_at", "updated_at")
    list_select_related = ("area", "merchant")

@admin.register(SavedPlace)
class SavedPlaceAdmin(admin.ModelAdmin):
    list_display = ("user", "place", "saved_at")
    list_filter = ("saved_at",)
    readonly_fields = ("saved_at",)
    search_fields = ("user__user__username", "place__name")