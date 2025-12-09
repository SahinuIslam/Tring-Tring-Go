from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User

from accounts.models import UserAccount
from travel.models import Area
from .models import CommunityPost, CommunityComment, CommunityReaction


def get_account_from_token(request):
    token = request.headers.get("X-User-Token")
    if not token:
        return None, Response({"detail": "Not logged in."},
                              status=status.HTTP_401_UNAUTHORIZED)

    try:
        user = User.objects.get(username=token)
    except User.DoesNotExist:
        return None, Response({"detail": "Invalid user token."},
                              status=status.HTTP_401_UNAUTHORIZED)

    try:
        account = UserAccount.objects.get(user=user)
    except UserAccount.DoesNotExist:
        return None, Response({"detail": "User account not found."},
                              status=status.HTTP_401_UNAUTHORIZED)

    return account, None


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
                return Response({"detail": "Invalid area_id"},
                                status=status.HTTP_400_BAD_REQUEST)

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
                "comments_count": post.comments_count,
                "likes_count": post.likes_count,
                "dislikes_count": post.dislikes_count,
            }
            for post in qs
        ]
        return Response(data)

    # POST: create new post (traveler only for now)
    account, error_resp = get_account_from_token(request)
    if error_resp:
        return error_resp


    title = request.data.get("title", "").strip()
    category = request.data.get("category")
    area_id = request.data.get("area_id")
    description = request.data.get("description", "").strip()

    if not title or not category or not description:
        return Response(
            {"detail": "title, category and description are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # area must be provided
    if not area_id:
        return Response({"detail": "area_id is required."},
                        status=status.HTTP_400_BAD_REQUEST)
    try:
        area_obj = Area.objects.get(id=int(area_id))
    except (ValueError, Area.DoesNotExist):
        return Response({"detail": "Invalid area_id."},
                        status=status.HTTP_400_BAD_REQUEST)

    if category not in dict(CommunityPost.CATEGORY_CHOICES):
        return Response({"detail": "Invalid category."},
                        status=status.HTTP_400_BAD_REQUEST)

    post = CommunityPost.objects.create(
        author=account,
        title=title,
        category=category,
        area=area_obj,
        description=description,
    )

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
            "comments_count": post.comments_count,
            "likes_count": post.likes_count,
            "dislikes_count": post.dislikes_count,
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

    comments = post.comments.select_related("author__user")

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
            "comments_count": post.comments_count,
            "likes_count": post.likes_count,
            "dislikes_count": post.dislikes_count,
            "comments": [
                {
                    "id": c.id,
                    "author": c.author.user.username,
                    "text": c.text,
                    "created_at": c.created_at.isoformat(),
                }
                for c in comments
            ],
        }
    )


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def community_add_comment(request, post_id):
    account, error_resp = get_account_from_token(request)
    if error_resp:
        return error_resp

    post = get_object_or_404(CommunityPost, id=post_id)

    text = (request.data.get("text") or "").strip()
    if not text:
        return Response({"detail": "Comment text is required."},
                        status=status.HTTP_400_BAD_REQUEST)

    comment = CommunityComment.objects.create(
        post=post,
        author=account,
        text=text,
    )

    # update cached count
    post.comments_count = post.comments.count()
    post.save(update_fields=["comments_count"])

    return Response(
        {
            "id": comment.id,
            "author": comment.author.user.username,
            "text": comment.text,
            "created_at": comment.created_at.isoformat(),
            "comments_count": post.comments_count,
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

    reaction_type = request.data.get("reaction")
    if reaction_type not in ["LIKE", "DISLIKE"]:
        return Response({"detail": "Invalid reaction."},
                        status=status.HTTP_400_BAD_REQUEST)

    post = get_object_or_404(CommunityPost, id=post_id)

    try:
        react_obj = CommunityReaction.objects.get(post=post, user=account)
        if react_obj.reaction == reaction_type:
            # same reaction → toggle off
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

    # recompute counts
    likes = CommunityReaction.objects.filter(post=post, reaction="LIKE").count()
    dislikes = CommunityReaction.objects.filter(post=post, reaction="DISLIKE").count()
    post.likes_count = likes
    post.dislikes_count = dislikes
    post.save(update_fields=["likes_count", "dislikes_count"])

    return Response(
        {"likes_count": likes, "dislikes_count": dislikes},
        status=status.HTTP_200_OK,
    )


