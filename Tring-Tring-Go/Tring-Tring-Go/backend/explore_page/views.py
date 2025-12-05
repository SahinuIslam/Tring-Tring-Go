from django.db.models import Avg, Count
from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Destination, Review, Tag
from .serializers import (
    DestinationSerializer,
    DestinationListSerializer,
    ReviewSerializer,
    ReviewCreateSerializer,
)

class DestinationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["category"]
    search_fields = ["name", "city", "country", "description"]
    ordering_fields = ["avg_rating", "created_at"]
    ordering = ["-avg_rating"]

    def get_queryset(self):
        return (
            Destination.objects.all()
            .annotate(
                avg_rating=Avg("reviews__rating"),
                review_count=Count("reviews"),
            )
        )

    def get_serializer_class(self):
        if self.action in ["list", "top_rated", "popular", "local", "heritage"]:
            return DestinationListSerializer
        return DestinationSerializer

    @action(detail=False, methods=["get"])
    def top_rated(self, request):
        category = request.query_params.get("category")
        qs = self.get_queryset()
        if category:
            qs = qs.filter(category=category)
        qs = qs.order_by("-avg_rating")[:20]
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def popular(self, request):
        category = request.query_params.get("category")
        qs = self.get_queryset()
        if category:
            qs = qs.filter(category=category)
        qs = qs.order_by("-review_count", "-avg_rating")[:20]
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def local(self, request):
        category = request.query_params.get("category")
        city = request.query_params.get("city")
        qs = self.get_queryset()
        if category:
            qs = qs.filter(category=category)
        if city:
            qs = qs.filter(city__iexact=city)
        serializer = self.get_serializer(qs[:20], many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def heritage(self, request):
        category = request.query_params.get("category", "place")
        qs = self.get_queryset().filter(category=category)
        qs = [d for d in qs if d.has_tag(Tag.HERITAGE)]
        serializer = self.get_serializer(qs[:20], many=True)
        return Response(serializer.data)

class ReviewViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Review.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return ReviewCreateSerializer
        return ReviewSerializer

    def perform_create(self, serializer):
        destination_id = self.request.data.get("destination_id")
        destination = Destination.objects.get(pk=destination_id)
        serializer.save(user=self.request.user, destination=destination)

