from httpx import request
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from firebase_admin import auth as firebase_auth
from django.contrib.auth.models import User
from django.contrib.auth import login

# Dashboard imports
from .serializers import SignupSerializer, LoginSerializer
from .models import UserAccount, TravelerProfile, LoginLog
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import UserAccount, TravelerProfile, MerchantProfile, AdminProfile
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny
from django.contrib.auth import logout
from travel.models import Area
from django.utils.dateparse import parse_time



class SignupAPIView(APIView):
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User created successfully."},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GoogleLoginAPIView(APIView):
    def post(self, request):
        id_token = request.data.get("id_token")
        if not id_token:
            return Response(
                {"detail": "Missing id_token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            decoded = firebase_auth.verify_id_token(id_token)
        except Exception:
            return Response(
                {"detail": "Invalid token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        uid = decoded["uid"]
        email = decoded.get("email")
        name = decoded.get("name") or (email.split("@")[0] if email else uid)

        user, created = User.objects.get_or_create(
            username=uid,
            defaults={"email": email or "", "first_name": name},
        )

        user_account, _ = UserAccount.objects.get_or_create(
            user=user,
            defaults={"role": "TRAVELER"},
        )

        TravelerProfile.objects.get_or_create(user_account=user_account)

        # log google login
        LoginLog.objects.create(user=user, method="GOOGLE")

        return Response(
            {
                "message": "Google login successful.",
                "email": email,
                "role": user_account.role,
            },
            status=status.HTTP_200_OK,
        )


class LoginAPIView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data["user"]
        login(request, user)

        user_account, _ = UserAccount.objects.get_or_create(
            user=user,
            defaults={"role": "TRAVELER"},
        )

        LoginLog.objects.create(user=user, method="PASSWORD")

        return Response(
            {
                "message": "Login successful.",
                "username": user.username,
                "email": user.email,
                "role": user_account.role,
                "token": user.username,  # simple dev token
            },
            status=status.HTTP_200_OK,
        )



#Traveler dashboard view
@csrf_exempt
@api_view(["GET"])
@permission_classes([AllowAny])
def traveler_dashboard(request):
    token = request.headers.get("X-User-Token")
    if not token:
        return Response({"detail": "Not logged in."}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        user = User.objects.get(username=token)
    except User.DoesNotExist:
        return Response({"detail": "Invalid user token."}, status=status.HTTP_401_UNAUTHORIZED)

    account, _ = UserAccount.objects.get_or_create(
        user=user, defaults={"role": "TRAVELER"}
    )

    if account.role != "TRAVELER":
        return Response({"detail": "Traveler access only"}, status=status.HTTP_403_FORBIDDEN)

    profile, _ = TravelerProfile.objects.get_or_create(
        user_account=account, defaults={"years_in_area": 0}
    )

    area = profile.area.name if profile.area else "Not set"
    years_in_area = profile.years_in_area
    profile_complete = bool(profile.area and profile.years_in_area > 0)

    suggestion = (
        "Add your area and years in area to get better local suggestions."
        if not profile_complete
        else "Your traveler profile is complete."
    )

    recent_logins = LoginLog.objects.filter(user=user).order_by("-login_time")[:5]
    login_history = [
        {"method": log.method, "login_time": log.login_time.isoformat()}
        for log in recent_logins
    ]

    data = {
        "user": {
            "username": user.username,
            "email": user.email,
            "role": account.role,
        },
        "profile": {
            "area": area,
            "years_in_area": years_in_area,
            "profile_complete": profile_complete,
        },
        "suggestion": suggestion,
        "login_history": login_history,
    }
    return Response(data)



# Merchant dashboard view
@csrf_exempt
@api_view(["GET"])
@permission_classes([AllowAny])
def merchant_dashboard(request):
    token = request.headers.get("X-User-Token")
    if not token:
        return Response(
            {"detail": "Not logged in."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        user = User.objects.get(username=token)
    except User.DoesNotExist:
        return Response(
            {"detail": "Invalid user token."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    account, _ = UserAccount.objects.get_or_create(
        user=user,
        defaults={"role": "MERCHANT"},
    )

    if account.role != "MERCHANT":
        return Response(
            {"detail": "Merchant access only"},
            status=status.HTTP_403_FORBIDDEN,
        )

    profile = account.merchant_profile

    stats = {
        "shop_name": profile.shop_name,
        "business_area": profile.business_area.name if profile.business_area else "Not set",
        "business_area_id": profile.business_area.id if profile.business_area else None,
        "opening_time": profile.opening_time.strftime("%H:%M") if profile.opening_time else None,
        "closing_time": profile.closing_time.strftime("%H:%M") if profile.closing_time else None,
        "years_in_business": profile.years_in_business,
        "description": profile.description,
        "is_verified": profile.is_verified,
        "status": "Verified" if profile.is_verified else "Pending verification",
    }

    data = {
        "role": account.role,
        "profile": stats,
        "message": f"{stats['shop_name']} - {stats['status']}",
    }
    return Response(data)


# Merchant profile update view
@csrf_exempt
@api_view(["PUT"])
@permission_classes([AllowAny])
def merchant_update_profile(request):
    token = request.headers.get("X-User-Token")
    if not token:
        return Response({"detail": "Not logged in."}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        user = User.objects.get(username=token)
    except User.DoesNotExist:
        return Response({"detail": "Invalid user token."}, status=status.HTTP_401_UNAUTHORIZED)

    account, _ = UserAccount.objects.get_or_create(
        user=user, defaults={"role": "MERCHANT"}
    )
    if account.role != "MERCHANT":
        return Response({"detail": "Merchant access only"}, status=status.HTTP_403_FORBIDDEN)

    try:
        profile = account.merchant_profile
    except MerchantProfile.DoesNotExist:
        return Response({"detail": "Merchant profile not found."}, status=status.HTTP_404_NOT_FOUND)

    data = request.data

    # 1) shop_name
    shop_name = data.get("shop_name", profile.shop_name)

    # 2) business_area_id -> Area FK
    business_area_id = data.get("business_area_id")
    if business_area_id is not None:
        try:
            business_area = Area.objects.get(id=int(business_area_id))
        except (ValueError, Area.DoesNotExist):
            return Response({"detail": "Invalid business_area_id."}, status=status.HTTP_400_BAD_REQUEST)
    else:
        business_area = profile.business_area

    # 3) opening_time / closing_time (strings "HH:MM" or null)
    opening_time_str = data.get("opening_time")
    closing_time_str = data.get("closing_time")

    if opening_time_str:
        opening_time = parse_time(opening_time_str)
        if opening_time is None:
            return Response({"detail": "Invalid opening_time format. Use HH:MM."},
                            status=status.HTTP_400_BAD_REQUEST)
    else:
        opening_time = None

    if closing_time_str:
        closing_time = parse_time(closing_time_str)
        if closing_time is None:
            return Response({"detail": "Invalid closing_time format. Use HH:MM."},
                            status=status.HTTP_400_BAD_REQUEST)
    else:
        closing_time = None

    # 4) years_in_business
    years_in_business = data.get("years_in_business", profile.years_in_business)
    try:
        years_in_business = int(years_in_business)
        if years_in_business < 0:
            raise ValueError
    except (ValueError, TypeError):
        return Response(
            {"detail": "years_in_business must be a non-negative integer."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 5) description
    description = data.get("description", profile.description)

    # Apply updates
    profile.shop_name = shop_name
    profile.business_area = business_area
    profile.opening_time = opening_time
    profile.closing_time = closing_time
    profile.years_in_business = years_in_business
    profile.description = description
    profile.save()

    return Response(
        {
            "shop_name": profile.shop_name,
            "business_area": profile.business_area.name if profile.business_area else "Not set",
            "business_area_id": profile.business_area.id if profile.business_area else None,
            "opening_time": profile.opening_time.strftime("%H:%M") if profile.opening_time else None,
            "closing_time": profile.closing_time.strftime("%H:%M") if profile.closing_time else None,
            "years_in_business": profile.years_in_business,
            "description": profile.description,
            "is_verified": profile.is_verified,
            "status": "Verified" if profile.is_verified else "Pending verification",
        },
        status=status.HTTP_200_OK,
    )



#Admin dashboard view
@csrf_exempt
@api_view(["GET"])
@permission_classes([AllowAny])
def admin_dashboard(request):
    token = request.headers.get("X-User-Token")
    if not token:
        return Response(
            {"detail": "Not logged in."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        user = User.objects.get(username=token)
    except User.DoesNotExist:
        return Response(
            {"detail": "Invalid user token."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        account = UserAccount.objects.get(user=user)
    except UserAccount.DoesNotExist:
        return Response(
            {"detail": "UserAccount not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if account.role != "ADMIN":
        return Response(
            {"detail": "Admin access only"},
            status=status.HTTP_403_FORBIDDEN,
        )

    total_users = UserAccount.objects.count()
    travelers = UserAccount.objects.filter(role="TRAVELER").count()
    merchants = UserAccount.objects.filter(role="MERCHANT").count()
    unverified_merchants = MerchantProfile.objects.filter(is_verified=False).count()

    data = {
        "role": account.role,
        "stats": {
            "total_users": total_users,
            "travelers": travelers,
            "merchants": merchants,
            "unverified_merchants": unverified_merchants,
        },
        "message": f"Managing {total_users} users",
    }
    return Response(data)

# Current user info view
@csrf_exempt
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    """Return current user information"""
    user_account = UserAccount.objects.get(user=request.user)
    
    data = {
        "username": request.user.username,
        "email": request.user.email,
        "role": user_account.role,
        "first_name": request.user.first_name,
        "last_name": request.user.last_name,
    }
    return Response(data)

# Traveler profile update view
@csrf_exempt
@api_view(["PUT"])
@permission_classes([AllowAny])
def traveler_update_profile(request):
    token = request.headers.get("X-User-Token")
    if not token:
        return Response({"detail": "Not logged in."}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        user = User.objects.get(username=token)
    except User.DoesNotExist:
        return Response({"detail": "Invalid user token."}, status=status.HTTP_401_UNAUTHORIZED)

    account, _ = UserAccount.objects.get_or_create(user=user, defaults={"role": "TRAVELER"})
    if account.role != "TRAVELER":
        return Response({"detail": "Traveler access only"}, status=status.HTTP_403_FORBIDDEN)

    profile, _ = TravelerProfile.objects.get_or_create(
        user_account=account, defaults={"years_in_area": 0}
    )

    area_id = request.data.get("area_id")
    years_in_area = request.data.get("years_in_area", profile.years_in_area)

    try:
        years_in_area = int(years_in_area)
        if years_in_area < 0:
            raise ValueError
    except (ValueError, TypeError):
        return Response(
            {"detail": "years_in_area must be a non-negative integer."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Update area if area_id provided
    if area_id is not None:
        try:
            area_id_int = int(area_id)
            area_obj = Area.objects.get(id=area_id_int)
            profile.area = area_obj
        except (ValueError, Area.DoesNotExist):
            return Response({"detail": "Invalid area_id."}, status=status.HTTP_400_BAD_REQUEST)

    profile.years_in_area = years_in_area
    profile.save()

    return Response(
        {
            "area": profile.area.name if profile.area else "Not set",
            "years_in_area": profile.years_in_area,
            "profile_complete": bool(profile.area and profile.years_in_area > 0),
        },
        status=status.HTTP_200_OK,
    )


# Logout view
@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def logout_view(request):
    """
    Log out Django session (for safety), even though React
    mainly uses localStorage/X-User-Token.
    """
    logout(request)  # clears session data and sessionid cookie
    return Response({"message": "Logged out."}, status=status.HTTP_200_OK)