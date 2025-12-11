from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.models import UserAccount
from accounts.views import get_or_create_traveler_profile
from .models import Place, SavedPlace, Review, Area
from .serializers import SavedPlaceSerializer, PlaceSerializer, ReviewSerializer


def _get_traveler_from_token(request):
    token = request.headers.get("X-User-Token")
    if not token:
        return None, Response(
            {"detail": "Not logged in."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        user = User.objects.get(username=token)
    except User.DoesNotExist:
        return None, Response(
            {"detail": "Invalid user token."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    account, _ = UserAccount.objects.get_or_create(
        user=user,
        defaults={"role": "TRAVELER"},
    )

    traveler_profile = get_or_create_traveler_profile(account)
    return account, None


# ---------- Saved places ----------

@csrf_exempt
@api_view(["GET"])
@permission_classes([AllowAny])
def list_saved_places(request):
    traveler, error = _get_traveler_from_token(request)
    if error:
        return error

    saved_qs = (
        SavedPlace.objects.filter(traveler=traveler)
        .select_related("place")
        .order_by("-saved_at")
    )
    serializer = SavedPlaceSerializer(saved_qs, many=True)
    return Response(serializer.data)


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def add_saved_place(request):
    traveler, error = _get_traveler_from_token(request)
    if error:
        return error

    place_id = request.data.get("place_id")
    if not place_id:
        return Response(
            {"detail": "place_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        place = Place.objects.get(id=place_id)
    except Place.DoesNotExist:
        return Response(
            {"detail": "Place not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    saved, created = SavedPlace.objects.get_or_create(
        traveler=traveler, place=place
    )
    if not created:
        return Response(
            {"detail": "Place already saved."},
            status=status.HTTP_200_OK,
        )

    serializer = SavedPlaceSerializer(saved)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(["DELETE"])
@permission_classes([AllowAny])
def remove_saved_place(request, pk):
    traveler, error = _get_traveler_from_token(request)
    if error:
        return error

    try:
        saved = SavedPlace.objects.get(id=pk, traveler=traveler)
    except SavedPlace.DoesNotExist:
        return Response(
            {"detail": "Saved place not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    saved.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ---------- Reviews ----------

@csrf_exempt
@api_view(["GET"])
@permission_classes([AllowAny])
def my_reviews(request):
    traveler, error = _get_traveler_from_token(request)
    if error:
        return error

    qs = Review.objects.filter(traveler=traveler).select_related("place")
    serializer = ReviewSerializer(qs, many=True)
    return Response(serializer.data)


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def create_review(request):
    traveler, error = _get_traveler_from_token(request)
    if error:
        return error

    data = request.data.copy()
    data["traveler"] = traveler.id

    place_id = data.get("place")
    if not place_id:
        return Response(
            {"detail": "place is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        place = Place.objects.get(id=place_id)
    except Place.DoesNotExist:
        return Response(
            {"detail": "Place not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = ReviewSerializer(data=data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    review = Review.objects.create(
        traveler=traveler,
        place=place,
        rating=serializer.validated_data["rating"],
        title=serializer.validated_data.get("title", ""),
        text=serializer.validated_data.get("text", ""),
    )

    # update rating stats
    place.recompute_rating()

    out = ReviewSerializer(review)
    return Response(out.data, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(["DELETE"])
@permission_classes([AllowAny])
def delete_review(request, pk):
    traveler, error = _get_traveler_from_token(request)
    if error:
        return error

    try:
        review = Review.objects.get(id=pk, traveler=traveler)
    except Review.DoesNotExist:
        return Response(
            {"detail": "Review not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    place = review.place
    review.delete()
    place.recompute_rating()

    return Response(status=status.HTTP_204_NO_CONTENT)


@csrf_exempt
@api_view(["PUT", "PATCH"])
@permission_classes([AllowAny])
def update_review(request, pk):
    traveler, error = _get_traveler_from_token(request)
    if error:
        return error

    try:
        review = Review.objects.get(id=pk, traveler=traveler)
    except Review.DoesNotExist:
        return Response(
            {"detail": "Review not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    data = request.data
    rating = data.get("rating", review.rating)
    title = data.get("title", review.title)
    text = data.get("text", review.text)

    try:
        rating = float(rating)
    except (TypeError, ValueError):
        return Response(
            {"detail": "rate between 0.0 and 5.0."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if rating < 1.0 or rating > 5.0:
        return Response(
            {"detail": "rate between 0.0 and 5.0."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    review.rating = rating
    review.title = title
    review.text = text
    review.save()

    review.place.recompute_rating()

    serializer = ReviewSerializer(review)
    return Response(serializer.data, status=status.HTTP_200_OK)


# ---------- Places / Areas ----------

@api_view(["GET"])
@permission_classes([AllowAny])
def list_places(request):
    qs = Place.objects.all().order_by("name")
    serializer = PlaceSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def list_areas(request):
    qs = Area.objects.all().order_by("name")
    data = [{"id": a.id, "name": a.name} for a in qs]
    return Response(data)
