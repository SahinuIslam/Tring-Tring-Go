from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from .models import ChatThread, ChatMessage
from .serializers import ChatThreadSerializer, ChatMessageSerializer

User = get_user_model()


def get_user_from_token(request):
    token = request.headers.get("X-User-Token")
    if not token:
        return None
    try:
        return User.objects.get(username=token)
    except User.DoesNotExist:
        return None


class ChatThreadListView(generics.ListAPIView):
    serializer_class = ChatThreadSerializer

    def get_queryset(self):
        user = get_user_from_token(self.request)
        if not user:
            return ChatThread.objects.none()
        return ChatThread.objects.filter(participants=user).order_by("-created_at")


class ChatThreadRequestView(APIView):
    def post(self, request):
        current_user = get_user_from_token(request)
        if not current_user:
            return Response(
                {"detail": "Not logged in."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        target_user_id = request.data.get("user_id")
        if not target_user_id:
            return Response(
                {"detail": "user_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if str(current_user.id) == str(target_user_id):
            return Response(
                {"detail": "You cannot start a chat with yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_user = get_object_or_404(User, id=target_user_id)

        thread = (
            ChatThread.objects
            .filter(participants=current_user)
            .filter(participants=target_user)
            .first()
        )

        if not thread:
            thread = ChatThread.objects.create(
                requested_by=current_user,
                status=ChatThread.PENDING,
            )
            thread.participants.add(current_user, target_user)

        serializer = ChatThreadSerializer(thread)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ChatThreadAcceptView(APIView):
    def post(self, request, pk):
        current_user = get_user_from_token(request)
        if not current_user:
            return Response(
                {"detail": "Not logged in."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        action = request.data.get("action", "accept")
        thread = get_object_or_404(ChatThread, id=pk)

        if current_user not in thread.participants.all():
            return Response(
                {"detail": "You are not part of this chat."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if thread.status != ChatThread.PENDING:
            return Response(
                {"detail": "Chat is not pending."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action == "accept":
            thread.status = ChatThread.ACTIVE
        elif action == "reject":
            thread.status = ChatThread.CLOSED
        else:
            return Response(
                {"detail": "Invalid action."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        thread.save()

        return Response(ChatThreadSerializer(thread).data)


class ChatMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatMessageSerializer

    def get_queryset(self):
        user = get_user_from_token(self.request)
        if not user:
            return ChatMessage.objects.none()

        thread_id = self.kwargs["thread_id"]
        thread = get_object_or_404(ChatThread, id=thread_id)

        if user not in thread.participants.all():
            return ChatMessage.objects.none()

        return thread.messages.order_by("created_at")

    def perform_create(self, serializer):
        user = get_user_from_token(self.request)
        if not user:
            raise PermissionError("Not logged in.")

        thread_id = self.kwargs["thread_id"]
        thread = get_object_or_404(ChatThread, id=thread_id)

        if user not in thread.participants.all():
            raise PermissionError("You are not part of this chat.")

        serializer.save(
            thread=thread,
            sender=user,
        )
