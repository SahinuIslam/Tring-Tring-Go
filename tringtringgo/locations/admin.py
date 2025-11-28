from django.contrib import admin
from .models import Area

@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ("name", "is_historic", "is_residential", "is_commercial", "community_post_count")
    list_filter = ("is_historic", "is_residential", "is_commercial")
    search_fields = ("name",)
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (None, {
            "fields": ("name", "slug", "description")
        }),
        ("Area Characteristics", {
            "fields": ("is_historic", "is_residential", "is_commercial")
        }),
        ("Display Information", {
            "fields": ("image", "average_rating", "community_post_count")
        }),
        ("Visit Timing", {
            "fields": ("best_time_start", "best_time_end", "avoid_time_start", "avoid_time_end", "avoid_reason"),
            "classes": ("collapse",)
        }),
        ("Emergency Information", {
            "fields": ("emergency_notes",),
            "classes": ("collapse",)
        }),
    )