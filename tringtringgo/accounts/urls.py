from django.urls import path
from .views import (
    SignupAPIView,
    GoogleLoginAPIView,
    LoginAPIView,
    traveler_dashboard,
    merchant_dashboard,
    admin_dashboard,
    me_view,
    traveler_update_profile,
    merchant_update_profile,
    logout_view,
)

urlpatterns = [
    path("signup/", SignupAPIView.as_view(), name="signup"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("google-login/", GoogleLoginAPIView.as_view(), name="google-login"),
    path("me/", me_view, name="me"),
    path("dashboard/traveler/", traveler_dashboard, name="traveler-dashboard"),
    path(
        "dashboard/traveler/profile/",
        traveler_update_profile,
        name="traveler-update-profile",
    ),
    path(
        "dashboard/merchant/profile/",
        merchant_update_profile,
        name="merchant-update-profile",
    ),
    path("dashboard/merchant/", merchant_dashboard, name="merchant-dashboard"),
    path("dashboard/admin/", admin_dashboard, name="admin-dashboard"),
    path("logout/", logout_view, name="logout"),
]