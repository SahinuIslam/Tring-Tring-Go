from django.urls import path
from .views import SignupAPIView, GoogleLoginAPIView  # adjust name if needed

urlpatterns = [
    path("signup/", SignupAPIView.as_view(), name="signup"),
    path("google-login/", GoogleLoginAPIView.as_view(), name="google-login"),
]
