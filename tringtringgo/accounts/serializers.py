from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import UserAccount, TravelerProfile, MerchantProfile, AdminProfile


class SignupSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=["TRAVELER", "MERCHANT", "ADMIN"])

    # Traveler
    area = serializers.CharField(required=False, allow_blank=True)
    years_in_area = serializers.IntegerField(required=False, min_value=0)

    # Merchant
    shop_name = serializers.CharField(required=False, allow_blank=True)
    business_area = serializers.CharField(required=False, allow_blank=True)
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
        area = validated_data.pop("area", "")
        years_in_area = validated_data.pop("years_in_area", 0)
        shop_name = validated_data.pop("shop_name", "")
        business_area = validated_data.pop("business_area", "")
        years_in_business = validated_data.pop("years_in_business", 0)
        description = validated_data.pop("description", "")

        password = validated_data.pop("password")
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        user_account = UserAccount.objects.create(user=user, role=role)

        if role == "TRAVELER":
            TravelerProfile.objects.create(
                user_account=user_account,
                area=area,
                years_in_area=years_in_area or 0,
            )
        elif role == "MERCHANT":
            MerchantProfile.objects.create(
                user_account=user_account,
                shop_name=shop_name,
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

        return user_account


class LoginSerializer(serializers.Serializer):
    username_or_email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        identifier = attrs.get("username_or_email")
        password = attrs.get("password")

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
