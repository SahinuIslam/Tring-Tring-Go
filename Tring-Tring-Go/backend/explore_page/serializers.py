from rest_framework import serializers
from .models import Destination, Review

class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Review
        fields = ["id", "user", "rating", "comment", "created_at"]

class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["rating", "comment"]

class DestinationSerializer(serializers.ModelSerializer):
    avg_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
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
