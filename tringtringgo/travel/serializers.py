from rest_framework import serializers
from accounts.models import MerchantProfile
from .models import Place, SavedPlace, Review, Service


class ReviewSummarySerializer(serializers.ModelSerializer):
    traveler_username = serializers.CharField(
        source="traveler.user.username", read_only=True
    )

    class Meta:
        model = Review
        fields = ["id", "traveler_username", "rating", "title", "text", "created_at"]


class PlaceSerializer(serializers.ModelSerializer):
    area_name = serializers.CharField(source="area.name", read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    latest_reviews = serializers.SerializerMethodField()

    class Meta:
        model = Place
        fields = [
            "id",
            "name",
            "area_name",
            "category",
            "image_url",
            "address",
            "average_rating",
            "review_count",
            "latest_reviews",
            "is_popular",
            "opening_time",
            "closing_time",
        ]

    def get_latest_reviews(self, obj):
        qs = obj.reviews.order_by("-created_at")[:3]
        return ReviewSummarySerializer(qs, many=True).data


class SavedPlaceSerializer(serializers.ModelSerializer):
    place = PlaceSerializer(read_only=True)

    class Meta:
        model = SavedPlace
        fields = ["id", "place", "saved_at"]


class ReviewSerializer(serializers.ModelSerializer):
    place_name = serializers.CharField(source="place.name", read_only=True)
    place_area = serializers.CharField(source="place.area.name", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "place",
            "place_name",
            "place_area",
            "rating",
            "title",
            "text",
            "created_at",
        ]
        read_only_fields = ["created_at"]


class MerchantProfileSerializer(serializers.ModelSerializer):
    area_name = serializers.CharField(source="business_area.name", read_only=True)
    owner_username = serializers.CharField(
        source="user_account.user.username", read_only=True
    )

    class Meta:
        model = MerchantProfile
        fields = [
            "id",
            "shop_name",
            "area_name",
            "business_type",
            "address",
            "years_in_business",
            "description",
            "is_verified",
            "owner_username",
        ]


class ServiceSerializer(serializers.ModelSerializer):
    area_name = serializers.CharField(source="area.name", read_only=True)
    category_label = serializers.CharField(
        source="get_category_display", read_only=True
    )

    class Meta:
        model = Service
        fields = [
            "id",
            "name",
            "category",
            "category_label",
            "area",
            "area_name",
            "address",
            "phone",
            "open_hours",
            "latitude",
            "longitude",
            "notes",
        ]
