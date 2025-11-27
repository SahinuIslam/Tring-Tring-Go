from django.urls import path
from .views import (
    PostListCreateView, 
    PostDetailView, 
    SavedItemsView, 
    UnsavePostView, 
    UserPostsView
)

urlpatterns = [
    # Posts endpoints
    path('posts/', PostListCreateView.as_view(), name='post-list-create'),  # GET: user's posts, POST: create new post
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),  # GET/DELETE: specific post
    
    # Saved items endpoints
    path('saved-items/', SavedItemsView.as_view(), name='saved-items'),    # GET: user's saved items, POST: save a post
    path('saved-items/<int:post_id>/', UnsavePostView.as_view(), name='unsave-post'),  # DELETE: remove from saved items
    
    # All posts endpoint (for community feed or recent posts)
    path('posts/all/', UserPostsView.as_view(), name='all-posts'),        # GET: all posts in the system
]

