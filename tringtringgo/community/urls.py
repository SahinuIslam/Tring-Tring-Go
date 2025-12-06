from django.urls import path
from .views import (
    community_posts,
    community_post_detail,
    community_add_comment,
    community_react,
)

urlpatterns = [
    path("posts/", community_posts, name="community-posts"),
    path("posts/<int:post_id>/", community_post_detail, name="community-post-detail"),
    path("posts/<int:post_id>/comments/", community_add_comment, name="community-add-comment"),
    path("posts/<int:post_id>/react/", community_react, name="community-react"),
]
