from django.urls import path
from .views import (
    admin_delete_comment,
    admin_delete_post,
    community_posts,
    community_post_detail,
    community_add_comment,
    community_react,
    admin_area_posts,
)

urlpatterns = [
    path("posts/", community_posts, name="community-posts"),
    path("posts/<int:post_id>/", community_post_detail, name="community-post-detail"),
    path("posts/<int:post_id>/comments/", community_add_comment, name="community-add-comment"),
    path("posts/<int:post_id>/react/", community_react, name="community-react"),
    # Admin moderation endpoints
    path("admin/posts/", admin_area_posts, name="admin-area-posts"),
    path("admin/posts/<int:post_id>/", admin_delete_post, name="admin-delete-post"),
    path("admin/comments/<int:comment_id>/", admin_delete_comment, name="admin-delete-comment"),
]
