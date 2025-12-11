from django.urls import path
from .views import (
    list_places,
    list_saved_places,
    add_saved_place,
    remove_saved_place,
    my_reviews,
    create_review,
    delete_review,
    update_review,
    list_areas,
)

urlpatterns = [
    path("places/", list_places, name="place-list"),

    path("saved-places/", list_saved_places, name="saved-place-list"),
    path("saved-places/add/", add_saved_place, name="saved-place-add"),
    path("saved-places/<int:pk>/", remove_saved_place, name="saved-place-remove"),

    path("reviews/", my_reviews, name="my-reviews"),
    path("reviews/create/", create_review, name="review-create"),
    path("reviews/<int:pk>/", update_review, name="review-update"),
    path("reviews/<int:pk>/delete/", delete_review, name="review-delete"),

    path("areas/", list_areas, name="area-list"),
]
