# accounts/serializers.py

from django.contrib.auth import authenticate, get_user_model
from django.db import IntegrityError
from rest_framework import serializers

from .models import (
    UserAccount,
    TravelerProfile,
    MerchantProfile,
    AdminProfile,
)
from travel.models import Area, Place

User = get_user_model()


class UserSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class SignupSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=["TRAVELER", "MERCHANT", "ADMIN"])

    # traveler/admin fields
    area_id = serializers.IntegerField(required=False, allow_null=True)
    years_in_area = serializers.IntegerField(required=False, min_value=0)

    # merchant-only fields
    shop_name = serializers.CharField(required=False, allow_blank=True)
    business_area_id = serializers.IntegerField(required=False, allow_null=True)
    years_in_business = serializers.IntegerField(required=False, min_value=0)
    description = serializers.CharField(required=False, allow_blank=True)

    # ---------- validation ----------

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already in use.")
        return value

    # ---------- create user + profiles ----------

    def create(self, validated_data):
        role = validated_data.pop("role")

        # traveler/admin
        area_id = validated_data.pop("area_id", None)
        years_in_area = validated_data.pop("years_in_area", 0)

        # merchant
        shop_name = validated_data.pop("shop_name", "")
        business_area_id = validated_data.pop("business_area_id", None)
        years_in_business = validated_data.pop("years_in_business", 0)
        description = validated_data.pop("description", "")

        password = validated_data.pop("password")

        # safe Area lookups
        area_obj = None
        if area_id is not None:
            try:
                area_obj = Area.objects.get(id=area_id)
            except Area.DoesNotExist:
                raise serializers.ValidationError({"area_id": "Invalid area_id."})

        business_area_obj = None
        if business_area_id is not None:
            try:
                business_area_obj = Area.objects.get(id=business_area_id)
            except Area.DoesNotExist:
                raise serializers.ValidationError(
                    {"business_area_id": "Invalid business_area_id."}
                )

        # create Django auth user
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
        )
        user.set_password(password)
        user.save()

        # wrapper with role
        user_account = UserAccount.objects.create(user=user, role=role)

        # role-specific profiles
        if role == "TRAVELER":
            TravelerProfile.objects.create(
                user_account=user_account,
                area=area_obj,
                years_in_area=years_in_area or 0,
            )

        elif role == "MERCHANT":
            merchant = MerchantProfile.objects.create(
                user_account=user_account,
                shop_name=shop_name or user.username,
                business_area=business_area_obj,
                years_in_business=years_in_business or 0,
                description=description,
            )

            # auto-create a Place for Explore
            Place.objects.create(
                name=merchant.shop_name,
                area=merchant.business_area,
                address=merchant.address or "",
                category="SHOP",      # default category
                is_popular=False,
                owner=merchant,
                image_url="",         # adjust if you add an image field
            )

        elif role == "ADMIN":
            try:
                AdminProfile.objects.create(
                    user_account=user_account,
                    area=area_obj,
                    years_in_area=years_in_area or 0,
                )
            except IntegrityError:
                raise serializers.ValidationError(
                    {"area_id": "This area already has an admin."}
                )

        return user_account


class LoginSerializer(serializers.Serializer):
    username_or_email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        identifier = attrs.get("username_or_email")
        password = attrs.get("password")

        # login by email or username
        try:
            user_obj = User.objects.get(email=identifier)
            username = user_obj.username
        except User.DoesNotExist:
            username = identifier

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError("Invalid credentials.")

        attrs["user"] = user
        return attrs

