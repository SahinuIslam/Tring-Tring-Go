from .views import update_profile_view
from django.urls import path
from .views import UserSearchView
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
    merchant_request_verification,
    admin_verification_requests,
    admin_handle_verification,
    user_settings_view,      # <-- add
    delete_account_view,
    update_profile_view,  
)

urlpatterns = [
    path("signup/", SignupAPIView.as_view(), name="signup"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("google-login/", GoogleLoginAPIView.as_view(), name="google-login"),
    path("me/", me_view, name="me"),
    path("logout/", logout_view, name="logout"),
    
    path("dashboard/traveler/", traveler_dashboard, name="traveler-dashboard"),
    path("dashboard/traveler/profile/", traveler_update_profile, name="traveler-update-profile",),
    
    path("dashboard/merchant/profile/", merchant_update_profile, name="merchant-update-profile",),
    path("dashboard/merchant/", merchant_dashboard, name="merchant-dashboard"),
    path("dashboard/merchant/request-verification/", merchant_request_verification, name="merchant-request-verification"),
    
    path("dashboard/admin/", admin_dashboard, name="admin-dashboard"),
    path("dashboard/admin/verification-requests/", admin_verification_requests, name="admin-verification-requests"),
    path("dashboard/admin/verification-requests/<int:request_id>/", admin_handle_verification, name="admin-handle-verification"),
    path("users/search/", UserSearchView.as_view(), name="user-search"),
    path("settings/", user_settings_view, name="user-settings"),
    path("delete-account/", delete_account_view, name="delete-account"),
    path("profile/", update_profile_view, name="update-profile"),
    path("profile/", update_profile_view, name="update-profile"),

]