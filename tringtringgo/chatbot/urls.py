# chatbot/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("chat/", views.chat, name="chatbot-chat"),  # /api/chatbot/chat/
]
