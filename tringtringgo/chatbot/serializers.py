from rest_framework import serializers
from .models import Place, Hospital, PoliceStation, ATM, Pharmacies, Transport, ChatMessage

class PlaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Place
        fields = ['id','name','area','rating','description']

class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = ['id','name','area']

class PoliceStationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PoliceStation
        fields = ['id','name','area']

class ATMSerializer(serializers.ModelSerializer):
    class Meta:
        model = ATM
        fields = ['id','name','area']

class PharmaciesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pharmacies
        fields = ['id','name','area']

class TransportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transport
        fields = ['id','name','area']

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id','role','message','created_at']
