from django.contrib import admin
from .models import Service

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "service_type", "area", "is_24_7", "is_active")
    list_filter = ("service_type", "is_24_7", "is_active")
    search_fields = ("name",)
    readonly_fields = ("created_at",)