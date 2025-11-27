from django.shortcuts import render

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Post, SavedItem
from .serializers import PostSerializer, CreatePostSerializer, SavedItemSerializer


class PostListCreateView(APIView):
    """
    API endpoint for listing a user's own posts and creating new posts.
    GET: Returns all posts created by the currently authenticated user
    POST: Creates a new post for the currently authenticated user
    """
    permission_classes = [IsAuthenticated]  # Only authenticated users can access this view

    def get(self, request):
        # Retrieve all posts created by the current user
        user_posts = Post.objects.filter(user_account=request.user.account)
        serializer = PostSerializer(user_posts, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        # Create a new post using the provided data
        serializer = CreatePostSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()  # This automatically sets the user_account to the current user
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PostDetailView(APIView):
    """
    API endpoint for retrieving, updating, or deleting a specific post.
    Only the user who created the post can update or delete it.
    """
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        # Get a specific post, but only if it belongs to the current user
        try:
            return Post.objects.get(pk=pk, user_account=self.request.user.account)
        except Post.DoesNotExist:
            return None

    def get(self, request, pk):
        # Retrieve a specific post
        post = self.get_object(pk)
        if post is None:
            return Response({"error": "Post not found or you don't have permission to access it."}, 
                          status=status.HTTP_404_NOT_FOUND)
        serializer = PostSerializer(post, context={'request': request})
        return Response(serializer.data)

    def delete(self, request, pk):
        # Delete a specific post
        post = self.get_object(pk)
        if post is None:
            return Response({"error": "Post not found or you don't have permission to delete it."}, 
                          status=status.HTTP_404_NOT_FOUND)
        post.delete()
        return Response({"message": "Post deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


class SavedItemsView(APIView):
    """
    API endpoint for managing saved items.
    GET: Returns all posts that the current user has saved
    POST: Saves a post for the current user
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Retrieve all saved items for the current user
        saved_items = SavedItem.objects.filter(user_account=request.user.account)
        serializer = SavedItemSerializer(saved_items, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        # Save a post for the current user
        serializer = SavedItemSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # This will either create a new saved item or return an existing one (no duplicates)
            saved_item = serializer.save()
            return Response({
                "message": "Post saved successfully.",
                "saved_item": SavedItemSerializer(saved_item, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UnsavePostView(APIView):
    """
    API endpoint for removing a post from a user's saved items.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, post_id):
        # Remove a specific post from the current user's saved items
        try:
            saved_item = SavedItem.objects.get(
                user_account=request.user.account,
                post_id=post_id
            )
            saved_item.delete()
            return Response({"message": "Post removed from saved items."}, status=status.HTTP_204_NO_CONTENT)
        except SavedItem.DoesNotExist:
            return Response({"error": "Saved item not found."}, status=status.HTTP_404_NOT_FOUND)


class UserPostsView(APIView):
    """
    API endpoint for retrieving all posts (not just the current user's posts).
    This can be used to display recent posts or community feed.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Retrieve all posts, ordered by creation date (most recent first)
        all_posts = Post.objects.all()
        serializer = PostSerializer(all_posts, many=True, context={'request': request})
        return Response(serializer.data)# Create your views here.
