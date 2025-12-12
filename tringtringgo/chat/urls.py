from django.urls import path

from .views import (
    ChatThreadListView,
    ChatThreadRequestView,
    ChatThreadAcceptView,
    ChatMessageListCreateView,
)

app_name = "chat"

urlpatterns = [
    path("threads/", ChatThreadListView.as_view(), name="thread-list"),
    path("threads/request/", ChatThreadRequestView.as_view(), name="thread-request"),
    path("threads/<int:pk>/accept/", ChatThreadAcceptView.as_view(), name="thread-accept"),
    path("threads/<int:thread_id>/messages/", ChatMessageListCreateView.as_view(), name="message-list-create"),
]
