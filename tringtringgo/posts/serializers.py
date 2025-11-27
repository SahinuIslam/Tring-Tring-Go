from rest_framework import serializers
from .models import Post, SavedItem
from accounts.models import UserAccount


class UserAccountSerializer(serializers.ModelSerializer):
    # These fields pull data from the related User model through the UserAccount
    username = serializers.CharField(source='user.username')  # Gets username from the related User object
    email = serializers.CharField(source='user.email')        # Gets email from the related User object

    class Meta:
        model = UserAccount
        fields = ['id', 'username', 'email', 'role']  # Fields that will be included when serializing UserAccount


class PostSerializer(serializers.ModelSerializer):
    # Include user information using the UserAccountSerializer (nested serialization)
    user = UserAccountSerializer(read_only=True)  # Automatically includes user details with each post
    
    # Show the human-readable version of post_type (e.g., "Price Alert" instead of "PRICE_ALERT")
    post_type_display = serializers.CharField(source='get_post_type_display', read_only=True)
    
    # Custom field that checks if the current user has saved this particular post
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'area', 'post_type', 'post_type_display',
            'user', 'created_at', 'updated_at', 'is_saved'
        ]

    def get_is_saved(self, obj):
        # This method determines whether the currently authenticated user has saved this post
        # obj is the current Post object being serialized
        user = self.context.get('request')  # Get the current request from the serializer context
        
        # Check if the user is authenticated and has a related UserAccount
        if user and hasattr(user, 'user') and hasattr(user.user, 'account'):
            # Check if a SavedItem exists linking this user to this specific post
            return SavedItem.objects.filter(
                user_account=user.user.account,  # The user's UserAccount
                post=obj                         # The current post being checked
            ).exists()  # Returns True if the user has saved this post, False otherwise
        
        return False  # If user is not authenticated, return False


class SavedItemSerializer(serializers.ModelSerializer):
    # When displaying saved items, include full post details
    post = PostSerializer(read_only=True)           # Full post information when retrieving saved items
    
    # Allow creating saved items by providing just a post ID (instead of full post object)
    post_id = serializers.IntegerField(write_only=True)  # Only used when creating, not when retrieving

    class Meta:
        model = SavedItem
        fields = ['id', 'post', 'post_id', 'created_at']

    def create(self, validated_data):
        # Custom create method because we receive post_id instead of a full post object
        post_id = validated_data.pop('post_id')  # Extract post_id from the data
        
        # Get the authenticated user's UserAccount
        user_account = self.context['request'].user.account
        
        # Get the Post object using the provided post_id
        post = Post.objects.get(id=post_id)
        
        # Create or get existing saved item (prevents duplicate saves)
        saved_item, created = SavedItem.objects.get_or_create(
            user_account=user_account,  # The user saving the post
            post=post                   # The post being saved
        )
        
        return saved_item  # Return the saved item (whether newly created or already existing)


class CreatePostSerializer(serializers.ModelSerializer):
    # Serializer specifically for creating new posts
    # Does not include read-only fields like user, created_at, etc.
    
    class Meta:
        model = Post
        fields = ['title', 'content', 'area', 'post_type']  # Only the fields that user provides when creating a post

    def create(self, validated_data):
        # Custom create method because the user_account is determined automatically
        # We don't want the user to provide their own user_account
        user_account = self.context['request'].user.account  # Get the currently authenticated user's account
        # Create the post with the user's account and the provided data
        return Post.objects.create(user_account=user_account, **validated_data)