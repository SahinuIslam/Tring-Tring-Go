from django.urls import path
from travel.views import (
    list_places,
    list_saved_places,
    add_saved_place,
    remove_saved_place,
    my_reviews,
    create_review,
    delete_review,
    update_review,
    list_areas,
    explore_merchants,
    list_services,
    create_service,
    modify_service,
    place_reviews,       # used by ExplorePage Reviews button
    upload_place_image,  # NEW: upload place image
)

urlpatterns = [
    # places
    path("places/", list_places, name="place-list"),
    path(
        "places/<int:pk>/upload-image/",
        upload_place_image,
        name="place-upload-image",
    ),

    # services
    path("services/", list_services, name="service-list"),
    path("services/create/", create_service, name="service-create"),
    path("services/<int:pk>/", modify_service, name="service-modify"),

    # reviews for a specific place (used by ExplorePage Reviews button)
    path(
        "places/<int:pk>/reviews/",
        place_reviews,
        name="place-reviews",
    ),

    # saved places
    path("saved-places/", list_saved_places, name="saved-place-list"),
    path("saved-places/add/", add_saved_place, name="saved-place-add"),
    path("saved-places/<int:pk>/", remove_saved_place, name="saved-place-remove"),

    # reviews (current user)
    path("reviews/", my_reviews, name="my-reviews"),
    path("reviews/create/", create_review, name="review-create"),
    path("reviews/<int:pk>/", update_review, name="review-update"),
    path("reviews/<int:pk>/delete/", delete_review, name="review-delete"),

    # areas
    path("areas/", list_areas, name="area-list"),

    # explore merchants
    path("explore/merchants/", explore_merchants, name="explore-merchants"),
]