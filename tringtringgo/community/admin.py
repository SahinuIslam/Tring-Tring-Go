from django.contrib import admin
from .models import CommunityPost, CommunityComment, CommunityReaction


@admin.register(CommunityPost)
class CommunityPostAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "area", "author", "created_at",
                    "comments_count", "likes_count", "dislikes_count")
    list_filter = ("category", "area", "created_at")
    search_fields = ("title", "description", "author__user__username")


@admin.register(CommunityComment)
class CommunityCommentAdmin(admin.ModelAdmin):
    list_display = ("post", "author", "created_at")
    search_fields = ("post__title", "author__user__username", "text")


@admin.register(CommunityReaction)
class CommunityReactionAdmin(admin.ModelAdmin):
    list_display = ("post", "user", "reaction", "created_at")
    list_filter = ("reaction",)
