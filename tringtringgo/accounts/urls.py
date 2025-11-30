from django.urls import path
from .views import SignupAPIView, GoogleLoginAPIView, LoginAPIView

urlpatterns = [
    path("signup/", SignupAPIView.as_view(), name="signup"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("google-login/", GoogleLoginAPIView.as_view(), name="google-login"),
]
