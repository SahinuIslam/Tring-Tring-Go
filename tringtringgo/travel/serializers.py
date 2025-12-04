from rest_framework import serializers
from .models import Place, SavedPlace, Review


class PlaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Place
        fields = ["id", "name", "area", "category", "image_url", "average_rating"]


class SavedPlaceSerializer(serializers.ModelSerializer):
    place = PlaceSerializer(read_only=True)

    class Meta:
        model = SavedPlace
        fields = ["id", "place", "saved_at"]


class ReviewSerializer(serializers.ModelSerializer):
    place_name = serializers.CharField(source="place.name", read_only=True)
    place_area = serializers.CharField(source="place.area", read_only=True)

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
