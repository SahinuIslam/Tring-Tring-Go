from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserAccount, TravelerProfile, MerchantProfile

class SignupSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=["TRAVELER", "MERCHANT"])

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

        # Create Django user
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=password,
        )

        # Create UserAccount with role
        user_account = UserAccount.objects.create(user=user, role=role)

        # Create role-specific profile
        if role == "TRAVELER":
            TravelerProfile.objects.create(user_account=user_account)
        elif role == "MERCHANT":
            MerchantProfile.objects.create(
                user_account=user_account,
                shop_name="",  # can be updated later
            )

        return user
