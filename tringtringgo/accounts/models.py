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
    # Where they live
    area = models.CharField(max_length=100, blank=True)
    # How long they have lived there (for trust/experience)
    years_in_area = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"TravelerProfile for {self.user_account.user.username}"


class MerchantProfile(models.Model):
    user_account = models.OneToOneField(
        UserAccount,
        on_delete=models.CASCADE,
        related_name="merchant_profile",
    )

    shop_name = models.CharField(max_length=100)
    business_area = models.CharField(max_length=100, blank=True)
    opening_time = models.TimeField(null=True, blank=True)
    years_in_business = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True)

    # Verification fields
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
