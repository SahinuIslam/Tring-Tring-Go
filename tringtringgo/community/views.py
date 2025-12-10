from statistics import mode
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User

from httpx import request
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from accounts.models import UserAccount
from travel.models import Area
from .models import CommunityPost, CommunityComment, CommunityReaction

from accounts.models import UserAccount, AdminProfile


# Helper function to get Admin from token
def get_admin_from_token(request):
    token = request.headers.get("X-User-Token")
    if not token:
        return None, Response(
            {"detail": "Not logged in."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        user = User.objects.get(username=token)
    except User.DoesNotExist:
        return None, Response(
            {"detail": "Invalid user token."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        account = UserAccount.objects.get(user=user)
    except UserAccount.DoesNotExist:
        return None, Response(
            {"detail": "User account not found."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if account.role != "ADMIN":
        return None, Response(
            {"detail": "Admin access only"},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        admin_profile = account.admin_profile
    except AdminProfile.DoesNotExist:
        return None, Response(
            {"detail": "Admin profile not found."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if not admin_profile.area:
        return None, Response(
            {"detail": "Admin has no area assigned."},
            status=status.HTTP_403_FORBIDDEN,
        )

    return admin_profile, None

# View to get posts for admin's area
@csrf_exempt
@api_view(["GET"])
@permission_classes([AllowAny])
def admin_area_posts(request):
    admin_profile, error_resp = get_admin_from_token(request)
    if error_resp:
        return error_resp

    area = admin_profile.area

    qs = CommunityPost.objects.filter(area=area).select_related(
        "author__user", "area"
    )

    data = [
        {
            "id": post.id,
            "title": post.title,
            "category": post.category,
            "category_label": post.get_category_display(),
            "area": post.area.name if post.area else None,
            "area_id": post.area.id if post.area else None,
            "description": post.description,
            "created_at": post.created_at.isoformat(),
            "author": post.author.user.username,
            "comments_count": post.comments.count(),
            "likes_count": post.reactions.filter(reaction="LIKE").count(),
            "dislikes_count": post.reactions.filter(reaction="DISLIKE").count(),
        }
        for post in qs
    ]

    return Response(data)

# View to delete a post in admin's area
@csrf_exempt
@api_view(["DELETE"])
@permission_classes([AllowAny])
def admin_delete_post(request, post_id):
    admin_profile, error_resp = get_admin_from_token(request)
    if error_resp:
        return error_resp

    area = admin_profile.area

    post = get_object_or_404(CommunityPost, id=post_id, area=area)
    post.delete()

    return Response(
        {"detail": "Post deleted."},
        status=status.HTTP_204_NO_CONTENT,
    )

# View to delete a comment in admin's area
@csrf_exempt
@api_view(["DELETE"])
@permission_classes([AllowAny])
def admin_delete_comment(request, comment_id):
    admin_profile, error_resp = get_admin_from_token(request)
    if error_resp:
        return error_resp

    area = admin_profile.area

    comment = get_object_or_404(
        CommunityComment,
        id=comment_id,
        post__area=area,
    )
    comment.delete()

    return Response(
        {"detail": "Comment deleted."},
        status=status.HTTP_204_NO_CONTENT,
    )


# Helper function to get UserAccount from token
def get_account_from_token(request):
    token = request.headers.get("X-User-Token")
    if not token:
        return None, Response(
            {"detail": "Not logged in."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        user = User.objects.get(username=token)
    except User.DoesNotExist:
        return None, Response(
            {"detail": "Invalid user token."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        account = UserAccount.objects.get(user=user)
    except UserAccount.DoesNotExist:
        return None, Response(
            {"detail": "User account not found."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    return account, None

# View to handle community posts
@csrf_exempt
@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def community_posts(request):
    if request.method == "GET":
        category = request.GET.get("category")
        area_id = request.GET.get("area_id")

        qs = CommunityPost.objects.all().select_related("author__user", "area")

        if category and category != "ALL":
            qs = qs.filter(category=category)

        if area_id:
            try:
                area_id_int = int(area_id)
                qs = qs.filter(area_id=area_id_int)
            except ValueError:
                return Response(
                    {"detail": "Invalid area_id"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        data = []
        for post in qs:
            comments_count = post.comments.count()
            likes_count = post.reactions.filter(reaction="LIKE").count()
            dislikes_count = post.reactions.filter(reaction="DISLIKE").count()

            data.append(
                {
                    "id": post.id,
                    "title": post.title,
                    "category": post.category,
                    "category_label": post.get_category_display(),
                    "area": post.area.name if post.area else None,
                    "area_id": post.area.id if post.area else None,
                    "description": post.description,
                    "created_at": post.created_at.isoformat(),
                    "author": post.author.user.username,
                    "comments_count": comments_count,
                    "likes_count": likes_count,
                    "dislikes_count": dislikes_count,
                }
            )
        return Response(data)

    # POST: create new post (traveler only)
    account, error_resp = get_account_from_token(request)
    if error_resp:
        return error_resp

    # NEW: trust frontend mode instead of DB role
    mode = request.headers.get("X-User-Mode")
    if mode != "TRAVELER":
            return Response({"detail": "Traveler access only"},
                    status=status.HTTP_403_FORBIDDEN)

    title = request.data.get("title", "").strip()
    category = request.data.get("category")
    area_id = request.data.get("area_id")
    description = request.data.get("description", "").strip()

    if not title or not category or not description:
        return Response(
            {"detail": "title, category and description are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not area_id:
        return Response(
            {"detail": "area_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        area_obj = Area.objects.get(id=int(area_id))
    except (ValueError, Area.DoesNotExist):
        return Response(
            {"detail": "Invalid area_id."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if category not in dict(CommunityPost.CATEGORY_CHOICES):
        return Response(
            {"detail": "Invalid category."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    post = CommunityPost.objects.create(
        author=account,
        title=title,
        category=category,
        area=area_obj,
        description=description,
    )

    # compute counts on the fly
    comments_count = post.comments.count()
    likes_count = post.reactions.filter(reaction="LIKE").count()
    dislikes_count = post.reactions.filter(reaction="DISLIKE").count()

    return Response(
        {
            "id": post.id,
            "title": post.title,
            "category": post.category,
            "category_label": post.get_category_display(),
            "area": post.area.name if post.area else None,
            "area_id": post.area.id if post.area else None,
            "description": post.description,
            "created_at": post.created_at.isoformat(),
            "author": post.author.user.username,
            "comments_count": comments_count,
            "likes_count": likes_count,
            "dislikes_count": dislikes_count,
        },
        status=status.HTTP_201_CREATED,
    )


@csrf_exempt
@api_view(["GET"])
@permission_classes([AllowAny])
def community_post_detail(request, post_id):
    post = get_object_or_404(
        CommunityPost.objects.select_related("author__user", "area"),
        id=post_id,
    )

    comments_qs = post.comments.select_related("author__user")
    comments = [
        {
            "id": c.id,
            "author": c.author.user.username,
            "text": c.text,
            "created_at": c.created_at.isoformat(),
        }
        for c in comments_qs
    ]

    comments_count = len(comments)
    likes_count = post.reactions.filter(reaction="LIKE").count()
    dislikes_count = post.reactions.filter(reaction="DISLIKE").count()

    return Response(
        {
            "id": post.id,
            "title": post.title,
            "category": post.category,
            "category_label": post.get_category_display(),
            "area": post.area.name if post.area else None,
            "area_id": post.area.id if post.area else None,
            "description": post.description,
            "created_at": post.created_at.isoformat(),
            "author": post.author.user.username,
            "comments_count": comments_count,
            "likes_count": likes_count,
            "dislikes_count": dislikes_count,
            "comments": comments,
        }
    )


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def community_add_comment(request, post_id):
    account, error_resp = get_account_from_token(request)
    if error_resp:
        return error_resp

    mode = request.headers.get("X-User-Mode")
    if mode != "TRAVELER":
        return Response({"detail": "Traveler access only"},
                    status=status.HTTP_403_FORBIDDEN)

    post = get_object_or_404(CommunityPost, id=post_id)

    text = (request.data.get("text") or "").strip()
    if not text:
        return Response(
            {"detail": "Comment text is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    comment = CommunityComment.objects.create(
        post=post,
        author=account,
        text=text,
    )

    comments_count = post.comments.count()

    return Response(
        {
            "id": comment.id,
            "author": comment.author.user.username,
            "text": comment.text,
            "created_at": comment.created_at.isoformat(),
            "comments_count": comments_count,
        },
        status=status.HTTP_201_CREATED,
    )


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def community_react(request, post_id):
    account, error_resp = get_account_from_token(request)
    if error_resp:
        return error_resp

    mode = request.headers.get("X-User-Mode")
    if mode != "TRAVELER":
        return Response({"detail": "Traveler access only"},
                    status=status.HTTP_403_FORBIDDEN)

    reaction_type = request.data.get("reaction")
    if reaction_type not in ["LIKE", "DISLIKE"]:
        return Response(
            {"detail": "Invalid reaction."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    post = get_object_or_404(CommunityPost, id=post_id)

    try:
        react_obj = CommunityReaction.objects.get(post=post, user=account)
        if react_obj.reaction == reaction_type:
            react_obj.delete()
        else:
            react_obj.reaction = reaction_type
            react_obj.save()
    except CommunityReaction.DoesNotExist:
        CommunityReaction.objects.create(
            post=post,
            user=account,
            reaction=reaction_type,
        )

    likes = CommunityReaction.objects.filter(
        post=post, reaction="LIKE"
    ).count()
    dislikes = CommunityReaction.objects.filter(
        post=post, reaction="DISLIKE"
    ).count()

    return Response(
        {"likes_count": likes, "dislikes_count": dislikes},
        status=status.HTTP_200_OK,
    )
