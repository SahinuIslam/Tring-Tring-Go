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
    path("saved-places/", list_saved_places, name="saved-places-list"),
    path("saved-places/add/", add_saved_place, name="saved-places-add"),
    path(
        "saved-places/<int:pk>/",
        remove_saved_place,
        name="saved-places-remove",
    ),
    path("places/", list_places, name="places-list"),
    
    path("my-reviews/", my_reviews, name="my-reviews"),
    path("reviews/", create_review, name="create-review"),
    path("reviews/<int:pk>/delete/", delete_review, name="delete-review"),
    path("reviews/<int:pk>/", update_review, name="update-review"), 
    path("areas/", list_areas, name="areas-list"),
]