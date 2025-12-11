from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


# User Account Model
class UserAccount(models.Model):
    ROLE_CHOICES = [
        ("TRAVELER", "Traveler"),
        ("MERCHANT", "Merchant"),
        ("ADMIN", "Admin"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="account",
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="TRAVELER")

    def __str__(self):
        return f"{self.user.username} ({self.role})"


# Traveler Profile Model
class TravelerProfile(models.Model):
    user_account = models.OneToOneField(
        UserAccount,
        on_delete=models.CASCADE,
        related_name="traveler_profile",
    )
    area = models.ForeignKey(
        "travel.Area",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="traveler_profiles",
    )
    years_in_area = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"TravelerProfile for {self.user_account.user.username}"


# Merchant Profile Model
class MerchantProfile(models.Model):
    user_account = models.OneToOneField(
        UserAccount,
        on_delete=models.CASCADE,
        related_name="merchant_profile",
    )

    shop_name = models.CharField(max_length=100)

    # business area of the merchant – points to travel.Area
    business_area = models.ForeignKey(
        "travel.Area",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="merchant_profiles",
    )

    business_type = models.CharField(max_length=100, blank=True)
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=30, blank=True)
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


# Admin Profile Model
class AdminProfile(models.Model):
    user_account = models.OneToOneField(
        UserAccount,
        on_delete=models.CASCADE,
        related_name="admin_profile",
    )
    # one admin per Area
    area = models.OneToOneField(
        "travel.Area",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admin_profile",
    )
    years_in_area = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"AdminProfile({self.user_account.user.username})"


# Login Log Model
class LoginLog(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="login_logs",
    )
    login_time = models.DateTimeField(auto_now_add=True)
    method = models.CharField(max_length=20)  # "PASSWORD" or "GOOGLE"

    def __str__(self):
        return f"{self.user.username} - {self.method} - {self.login_time}"


# Merchant Verification Request Model
class MerchantVerificationRequest(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]

    merchant = models.OneToOneField(
        MerchantProfile,
        on_delete=models.CASCADE,
        related_name="verification_request",
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="PENDING",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        UserAccount,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="merchant_verifications",
        limit_choices_to={"role": "ADMIN"},
    )
    admin_note = models.TextField(blank=True)

    def __str__(self):
        return f"{self.merchant.shop_name} - {self.status}"

