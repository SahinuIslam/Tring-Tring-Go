from django.contrib import admin
from .models import FoodItem, PriceUpdate

@admin.register(FoodItem)
class FoodItemAdmin(admin.ModelAdmin):
    list_display = ("name", "place", "area", "standard_price", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)
    readonly_fields = ("created_at",)

@admin.register(PriceUpdate)
class PriceUpdateAdmin(admin.ModelAdmin):
    list_display = ("food_item", "current_price", "price_status", "confirmation_count", "updated_by", "created_at")
    list_filter = ("price_status",)
    readonly_fields = ("created_at",)
    search_fields = ("food_item__name", "updated_by__user__username")
    list_select_related = ("food_item", "updated_by")