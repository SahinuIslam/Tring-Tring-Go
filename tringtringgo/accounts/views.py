from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from firebase_admin import auth as firebase_auth
from django.contrib.auth.models import User
from django.contrib.auth import login

from .serializers import SignupSerializer, LoginSerializer
from .models import UserAccount, TravelerProfile, LoginLog


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
            },
            status=status.HTTP_200_OK,
        )
