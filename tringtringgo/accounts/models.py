from django.db import models
from django.contrib.auth.models import User


class UserAccount(models.Model):
    ROLE_CHOICES = [
        ("TRAVELER", "Traveler"),
        ("MERCHANT", "Merchant"),
        ("ADMIN", "Admin"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="account")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class TravelerProfile(models.Model):
    user_account = models.OneToOneField(
        UserAccount,
        on_delete=models.CASCADE,
        related_name="traveler_profile",
    )
    area = models.CharField(max_length=100, blank=True)
    years_in_area = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"TravelerProfile for {self.user_account.user.username}"


class MerchantProfile(models.Model):

    MERCHANT_TYPES = [
        ("RESTAURANT", "Restaurant"),
        ("SHOP", "Shop"),
        ("MALL", "Mall"),
        ("SERVICE", "Service"),
        ("CAFE", "Cafe"),
        ("STREET_FOOD", "Street Food"),
        ("HOTEL", "Hotel"),
        ("OTHER", "Other"),
    ]

    user_account = models.OneToOneField(
        UserAccount,
        on_delete=models.CASCADE,
        related_name="merchant_profile",
    )

    merchant_type = models.CharField(max_length=20, choices=MERCHANT_TYPES, default="OTHER")
    shop_name = models.CharField(max_length=100)
    business_area = models.CharField(max_length=100, blank=True)
    opening_time = models.TimeField(null=True, blank=True)
    closing_time = models.TimeField(null=True, blank=True)
    years_in_business = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True)

    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        UserAccount,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="verified_merchants",
        limit_choices_to={"role": "ADMIN"},
    )

    def __str__(self):
        status = "Verified" if self.is_verified else "Unverified"
        return f"{self.shop_name} ({status}) - {self.user_account.user.username}"


class AdminProfile(models.Model):
    user_account = models.OneToOneField(
        UserAccount,
        on_delete=models.CASCADE,
        related_name="admin_profile",
    )
    area = models.CharField(max_length=100, blank=True)
    years_in_area = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"AdminProfile({self.user_account.user.username})"


class LoginLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="login_logs")
    login_time = models.DateTimeField(auto_now_add=True)
    method = models.CharField(max_length=20)  # "PASSWORD" or "GOOGLE"

    def __str__(self):
        return f"{self.user.username} - {self.method} - {self.login_time}"
