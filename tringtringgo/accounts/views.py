import profile
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
from travel.models import Area , Place
from django.utils.dateparse import parse_time
from .models import MerchantVerificationRequest
from accounts.models import UserAccount, TravelerProfile, MerchantProfile, AdminProfile
from django.contrib.auth.models import User




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
                "username": user.username,          
                "email": email,
                "role": user_account.role,
                "token": user.username,            
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
        user=user,
        defaults={"role": "TRAVELER"},
    )


    # IMPORTANT: do NOT block merchants here; just ensure traveler profile exists
    profile = get_or_create_traveler_profile(account)


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
            "role": account.role,  # could be MERCHANT, TRAVELER, ADMIN
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
   
    # Decide display status from verification + request
    try:
        req = profile.verification_request
        req_status = req.status  # "PENDING", "APPROVED", "REJECTED"
    except MerchantVerificationRequest.DoesNotExist:
        req_status = None


    if profile.is_verified:
        display_status = "Verified"
    elif req_status == "PENDING":
        display_status = "Pending verification"
    elif req_status == "REJECTED":
        display_status = "Rejected"
    else:
        display_status = "Not requested"


       


    stats = {
        "shop_name": profile.shop_name,
        "business_area": profile.business_area.name if profile.business_area else "Not set",
        "business_area_id": profile.business_area.id if profile.business_area else None,
        "business_type": profile.business_type or "",
        "address": profile.address or "",
        "phone": profile.phone or "",
        "opening_time": profile.opening_time.strftime("%H:%M") if profile.opening_time else None,
        "closing_time": profile.closing_time.strftime("%H:%M") if profile.closing_time else None,
        "years_in_business": profile.years_in_business,
        "description": profile.description,
        "is_verified": profile.is_verified,
        "status": display_status,
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
        user=user, defaults={"role": "MERCHANT"}
    )
    if account.role != "MERCHANT":
        return Response(
            {"detail": "Merchant access only"},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        profile = account.merchant_profile
    except MerchantProfile.DoesNotExist:
        return Response(
            {"detail": "Merchant profile not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    data = request.data

    # 0) business info
    business_type = data.get("business_type", profile.business_type)
    address = data.get("address", profile.address)
    phone = data.get("phone", profile.phone)

    # 1) shop_name
    shop_name = data.get("shop_name", profile.shop_name)

    # If verified, prevent changes to verification fields
    if profile.is_verified:
        identity_changed = (
            shop_name != profile.shop_name
            or business_type != profile.business_type
            or address != profile.address
            or phone != profile.phone
            or data.get("description", profile.description) != profile.description
        )
        if identity_changed:
            return Response(
                {
                    "detail": (
                        "Verified business identity fields "
                        "(name, type, address, phone, description) cannot be changed."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    # 2) business_area_id -> Area FK
    business_area_id = data.get("business_area_id")
    if business_area_id is not None:
        try:
            business_area = Area.objects.get(id=int(business_area_id))
        except (ValueError, Area.DoesNotExist):
            return Response(
                {"detail": "Invalid business_area_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    else:
        business_area = profile.business_area

    # 3) opening_time / closing_time (strings "HH:MM" or null)
    opening_time_str = data.get("opening_time")
    closing_time_str = data.get("closing_time")

    if opening_time_str:
        opening_time = parse_time(opening_time_str)
        if opening_time is None:
            return Response(
                {"detail": "Invalid opening_time format. Use HH:MM."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    else:
        opening_time = None

    if closing_time_str:
        closing_time = parse_time(closing_time_str)
        if closing_time is None:
            return Response(
                {"detail": "Invalid closing_time format. Use HH:MM."},
                status=status.HTTP_400_BAD_REQUEST,
            )
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

    # Apply updates to MerchantProfile
    profile.business_type = business_type
    profile.address = address
    profile.phone = phone
    profile.shop_name = shop_name
    profile.business_area = business_area
    profile.opening_time = opening_time
    profile.closing_time = closing_time
    profile.years_in_business = years_in_business
    profile.description = description
    profile.save()

    # Keep Place in sync so Explore page sees this merchant, including hours
    Place.objects.update_or_create(
        owner=profile,
        defaults={
            "name": profile.shop_name,
            "area": profile.business_area,
            "category": profile.business_type or "SHOP",
            "opening_time": profile.opening_time,
            "closing_time": profile.closing_time,
            # "image_url": "...",  # optional later
        },
    )

    # Determine display_status based on verification request
    try:
        req = profile.verification_request
        req_status = req.status
    except MerchantVerificationRequest.DoesNotExist:
        req_status = None

    if profile.is_verified:
        display_status = "Verified"
    elif req_status == "PENDING":
        display_status = "Pending verification"
    elif req_status == "REJECTED":
        display_status = "Rejected"
    else:
        display_status = "Not requested"

    return Response(
        {
            "shop_name": profile.shop_name,
            "business_area": profile.business_area.name
            if profile.business_area
            else "Not set",
            "business_area_id": profile.business_area.id
            if profile.business_area
            else None,
            "business_type": profile.business_type,
            "address": profile.address,
            "phone": profile.phone,
            "opening_time": profile.opening_time.strftime("%H:%M")
            if profile.opening_time
            else None,
            "closing_time": profile.closing_time.strftime("%H:%M")
            if profile.closing_time
            else None,
            "years_in_business": profile.years_in_business,
            "description": profile.description,
            "is_verified": profile.is_verified,
            "status": display_status,
        },
        status=status.HTTP_200_OK,
    )



# Merchant request verification view
@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def merchant_request_verification(request):
    token = request.headers.get("X-User-Token")
    if not token:
        return Response({"detail": "Not logged in."}, status=status.HTTP_401_UNAUTHORIZED)


    try:
        user = User.objects.get(username=token)
    except User.DoesNotExist:
        return Response({"detail": "Invalid user token."}, status=status.HTTP_401_UNAUTHORIZED)


    account = UserAccount.objects.get(user=user)
    if account.role != "MERCHANT":
        return Response({"detail": "Merchant access only"}, status=status.HTTP_403_FORBIDDEN)


    profile = account.merchant_profile
    if profile.is_verified:
        return Response(
        {"detail": "This business is already verified."},
        status=status.HTTP_400_BAD_REQUEST,
    )



    req_obj, created = MerchantVerificationRequest.objects.get_or_create(
        merchant=profile,
        defaults={"status": "PENDING"},
    )


    if not created and req_obj.status == "PENDING":
        return Response(
            {"detail": "Verification request already pending."},
            status=status.HTTP_400_BAD_REQUEST,
        )


    if not created:
        req_obj.status = "PENDING"
        req_obj.reviewed_at = None
        req_obj.reviewed_by = None
        req_obj.admin_note = ""
        req_obj.save()


    return Response(
        {"status": req_obj.status, "message": "Verification request submitted."},
        status=status.HTTP_201_CREATED,
    )



#Admin dashboard view


@csrf_exempt
@api_view(["GET"])
@permission_classes([AllowAny])
def admin_dashboard(request):
    token = request.headers.get("X-User-Token")
    if not token:
        return Response({"detail": "Not logged in."},
                        status=status.HTTP_401_UNAUTHORIZED)


    try:
        user = User.objects.get(username=token)
    except User.DoesNotExist:
        return Response({"detail": "Invalid user token."},
                        status=status.HTTP_401_UNAUTHORIZED)


    try:
        account = UserAccount.objects.get(user=user)
    except UserAccount.DoesNotExist:
        return Response({"detail": "User account not found."},
                        status=status.HTTP_401_UNAUTHORIZED)


    if account.role != "ADMIN":
        return Response({"detail": "Admin access only"},
                        status=status.HTTP_403_FORBIDDEN)


    try:
        admin_profile = account.admin_profile
    except AdminProfile.DoesNotExist:
        return Response({"detail": "Admin profile not found."},
                        status=status.HTTP_403_FORBIDDEN)


    area = admin_profile.area


    merchants_qs = MerchantProfile.objects.filter(business_area=area)
    total_merchants = merchants_qs.count()
    verified_merchants = merchants_qs.filter(is_verified=True).count()
    unverified_merchants = merchants_qs.filter(is_verified=False).count()


    data = {
        "role": account.role,
        "admin": {
            "username": user.username,
            "area": area.name if area else "No area assigned",
        },
        "stats": {
            "total_merchants_in_area": total_merchants,
            "verified_merchants_in_area": verified_merchants,
            "unverified_merchants_in_area": unverified_merchants,
        },
        "message": f"Admin for {area.name if area else 'no area'}",
    }
    return Response(data)


    token = request.headers.get("X-User-Token")
    if not token:
        return Response({"detail": "Not logged in."}, status=status.HTTP_401_UNAUTHORIZED)


    try:
        user = User.objects.get(username=token)
    except User.DoesNotExist:
        return Response({"detail": "Invalid user token."}, status=status.HTTP_401_UNAUTHORIZED)


    account = UserAccount.objects.get(user=user)
    if account.role != "ADMIN":
        return Response({"detail": "Admin access only"}, status=status.HTTP_403_FORBIDDEN)


    admin_profile = account.admin_profile
    area = admin_profile.area


    # stats for this admin's area only
    merchants_qs = MerchantProfile.objects.filter(business_area=area)
    total_merchants = merchants_qs.count()
    verified_merchants = merchants_qs.filter(is_verified=True).count()
    unverified_merchants = merchants_qs.filter(is_verified=False).count()


    data = {
        "role": account.role,
        "admin": {
            "username": user.username,
            "area": area.name if area else "No area assigned",
        },
        "stats": {
            "total_merchants_in_area": total_merchants,
            "verified_merchants_in_area": verified_merchants,
            "unverified_merchants_in_area": unverified_merchants,
        },
        "message": f"Admin for {area.name if area else 'no area'}",
    }
    return Response(data)


# Admin verification requests view
@csrf_exempt
@api_view(["GET"])
@permission_classes([AllowAny])
def admin_verification_requests(request):
    token = request.headers.get("X-User-Token")
    if not token:
        return Response({"detail": "Not logged in."}, status=status.HTTP_401_UNAUTHORIZED)


    try:
        user = User.objects.get(username=token)
    except User.DoesNotExist:
        return Response({"detail": "Invalid user token."}, status=status.HTTP_401_UNAUTHORIZED)


    account = UserAccount.objects.get(user=user)
    if account.role != "ADMIN":
        return Response({"detail": "Admin access only"}, status=status.HTTP_403_FORBIDDEN)


    admin_profile = account.admin_profile
    area = admin_profile.area


    qs = MerchantVerificationRequest.objects.filter(
        merchant__business_area=area
    ).select_related("merchant", "merchant__user_account")


    data = [
        {
            "id": req.id,
            "merchant_id": req.merchant.id,
            "shop_name": req.merchant.shop_name,
            "business_type": req.merchant.business_type,
            "address": req.merchant.address,
            "phone": req.merchant.phone,
            "status": req.status,
            "created_at": req.created_at.isoformat(),
        }
        for req in qs
    ]
    return Response(data)


# Admin handle verification request view
@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def admin_handle_verification(request, request_id):
    token = request.headers.get("X-User-Token")
    if not token:
        return Response({"detail": "Not logged in."}, status=status.HTTP_401_UNAUTHORIZED)


    try:
        user = User.objects.get(username=token)
    except User.DoesNotExist:
        return Response({"detail": "Invalid user token."}, status=status.HTTP_401_UNAUTHORIZED)


    account = UserAccount.objects.get(user=user)
    if account.role != "ADMIN":
        return Response({"detail": "Admin access only"}, status=status.HTTP_403_FORBIDDEN)


    admin_profile = account.admin_profile
    area = admin_profile.area


    try:
        req_obj = MerchantVerificationRequest.objects.select_related(
            "merchant", "merchant__business_area"
        ).get(id=request_id, merchant__business_area=area)
    except MerchantVerificationRequest.DoesNotExist:
        return Response(
            {"detail": "Request not found for your area."},
            status=status.HTTP_404_NOT_FOUND,
        )


    action = request.data.get("action")
    admin_note = request.data.get("admin_note", "")


    if action not in ["APPROVE", "REJECT"]:
        return Response({"detail": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)


    if action == "APPROVE":
        req_obj.status = "APPROVED"
        req_obj.merchant.is_verified = True
        req_obj.merchant.verified_by = account
        req_obj.merchant.save()
    else:  # REJECT
        req_obj.status = "REJECTED"
        req_obj.merchant.is_verified = False
        req_obj.merchant.verified_by = None
        req_obj.merchant.save()



    from django.utils import timezone
    req_obj.reviewed_at = timezone.now()
    req_obj.reviewed_by = account
    req_obj.admin_note = admin_note
    req_obj.save()


    return Response(
        {
            "id": req_obj.id,
            "status": req_obj.status,
            "message": f"Request {req_obj.status.lower()}."
        },
        status=status.HTTP_200_OK,
    )



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
        defaults={"role": "TRAVELER"},
    )


    # IMPORTANT: do NOT block merchants here
    profile = get_or_create_traveler_profile(account)


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



# Helper to get or create TravelerProfile
def get_or_create_traveler_profile(account):
    """
    Ensure this UserAccount has a TravelerProfile.
    Useful when a MERCHANT also wants traveler features (Explore, save, rate).
    """
    profile, _ = TravelerProfile.objects.get_or_create(
        user_account=account,
        defaults={"years_in_area": 0},
    )
    return profile



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