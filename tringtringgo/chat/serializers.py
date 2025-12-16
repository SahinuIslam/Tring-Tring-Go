from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ChatThread, ChatMessage

User = get_user_model()


class UserShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserShortSerializer(read_only=True)

    class Meta:
        model = ChatMessage
        fields = ["id", "thread", "sender", "text", "created_at", "is_read"]
        read_only_fields = ["id", "sender", "created_at", "is_read", "thread"]


class ChatThreadSerializer(serializers.ModelSerializer):
    participants = UserShortSerializer(many=True, read_only=True)
    requested_by = UserShortSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatThread
        fields = [
            "id",
            "participants",
            "status",
            "requested_by",
            "created_at",
            "last_message",
        ]

    def get_last_message(self, obj):
        msg = obj.messages.order_by("-created_at").first()
        if not msg:
            return None
        return ChatMessageSerializer(msg).data
