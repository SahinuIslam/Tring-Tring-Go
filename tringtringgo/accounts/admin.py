from django.contrib import admin
from .models import (
    UserAccount,
    TravelerProfile,
    MerchantProfile,
    AdminProfile,
    LoginLog,
)


@admin.register(UserAccount)
class UserAccountAdmin(admin.ModelAdmin):
    list_display = ("user", "role")
    list_filter = ("role",)
    search_fields = ("user__username", "user__email")


@admin.register(TravelerProfile)
class TravelerProfileAdmin(admin.ModelAdmin):
    list_display = ("user_account", "area", "years_in_area")
    list_filter = ("area",)
    search_fields = ("user_account__user__username",)


@admin.register(MerchantProfile)
class MerchantProfileAdmin(admin.ModelAdmin):
    list_display = ("shop_name", "business_area", "is_verified", "years_in_business")
    list_filter = ("business_area", "is_verified")
    search_fields = ("shop_name", "user_account__user__username")


@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ("user_account", "area", "years_in_area")
    list_filter = ("area",)
    search_fields = ("user_account__user__username",)


@admin.register(LoginLog)
class LoginLogAdmin(admin.ModelAdmin):
    list_display = ("user", "method", "login_time")
    list_filter = ("method", "login_time")
    search_fields = ("user__username", "user__email")
