from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserAccount,
    TravelerProfile,
    MerchantProfile,
    AdminProfile,
)


class SignupSerializer(serializers.Serializer):
    # Common fields
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    # Role
    role = serializers.ChoiceField(choices=["TRAVELER", "MERCHANT", "ADMIN"])

    # Traveler / Admin shared fields
    area = serializers.CharField(max_length=100, required=False, allow_blank=True)
    years_in_area = serializers.IntegerField(required=False, min_value=0)

    # Merchant-only fields
    shop_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    business_area = serializers.CharField(
        max_length=100, required=False, allow_blank=True
    )
    years_in_business = serializers.IntegerField(required=False, min_value=0)
    description = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already in use.")
        return value

    def create(self, validated_data):
        role = validated_data.pop("role")
        password = validated_data.pop("password")

        # Extract optional fields safely
        area = validated_data.pop("area", "")
        years_in_area = validated_data.pop("years_in_area", 0)
        shop_name = validated_data.pop("shop_name", "")
        business_area = validated_data.pop("business_area", "")
        years_in_business = validated_data.pop("years_in_business", 0)
        description = validated_data.pop("description", "")

        # Create Django user
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=password,
        )

        # Base account with role
        user_account = UserAccount.objects.create(user=user, role=role)

        # Role-specific profiles
        if role == "TRAVELER":
            TravelerProfile.objects.create(
                user_account=user_account,
                area=area,
                years_in_area=years_in_area or 0,
            )
        elif role == "MERCHANT":
            MerchantProfile.objects.create(
                user_account=user_account,
                shop_name=shop_name or user.username,
                business_area=business_area,
                years_in_business=years_in_business or 0,
                description=description,
            )
        elif role == "ADMIN":
            AdminProfile.objects.create(
                user_account=user_account,
                area=area,
                years_in_area=years_in_area or 0,
            )

        return user
