from django.contrib import admin
from .models import CommunityPost, PostComment

@admin.register(CommunityPost)
class CommunityPostAdmin(admin.ModelAdmin):
    list_display = ("title", "post_type", "author", "area", "place", "helpful_count", "created_at")
    list_filter = ("post_type", "is_active")
    search_fields = ("title", "content", "author__user__username")
    readonly_fields = ("created_at",)
    date_hierarchy = "created_at"
    list_select_related = ("author", "area", "place")

@admin.register(PostComment)
class PostCommentAdmin(admin.ModelAdmin):
    list_display = ("post", "author", "created_at")
    readonly_fields = ("created_at",)
    search_fields = ("content", "author__user__username")