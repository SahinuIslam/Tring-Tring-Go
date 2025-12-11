from rest_framework import serializers
from .models import Place, SavedPlace, Review


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
