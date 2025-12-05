from rest_framework import serializers
from .models import Destination, Review


class ReviewSerializer(serializers.ModelSerializer):
    # This field assumes the User model has a usable __str__ method
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Review
        fields = ["id", "user", "rating", "comment", "created_at"]


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["rating", "comment"]


class DestinationSerializer(serializers.ModelSerializer):
    # Correctly defines model @property fields as ReadOnlyField
    avg_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    # Nested serializer to include all reviews when fetching a single destination
    reviews = ReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Destination
        fields = [
            "id",
            "name",
            "description",
            "category",
            "tags",
            "city",
            "country",
            "image_url",
            "avg_rating",
            "review_count",
            "reviews",
        ]


class DestinationListSerializer(serializers.ModelSerializer):
    avg_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Destination
        fields = [
            "id",
            "name",
            "description",
            "category",
            "tags",
            "city",
            "country",
            "image_url",
            "avg_rating",
            "review_count",
        ]