from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from travel.models import Service, Place, Area  


class ChatbotApiTests(APITestCase):
    def setUp(self):
        # minimal data
        self.area = Area.objects.create(name="Dhanmondi")
        self.service = Service.objects.create(
            name="Test Hospital",
            category="HOSPITAL",  
            area=self.area,
            address="Road 1",
            phone="0123456789",
        )
        self.place = Place.objects.create(
            name="Test Place",
            area=self.area,
            category="PARK",  
        )
        self.url = reverse("chatbot-chat")

    def test_greeting(self):
        resp = self.client.post(self.url, {"message": "hi"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("Hello", resp.data["reply"])

    def test_hospitals_near(self):
        resp = self.client.post(
            self.url,
            {"message": "hospitals near Dhanmondi"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("Hospitals near dhanmondi", resp.data["reply"])
        self.assertIn("Test Hospital", resp.data["reply"])

    def test_places_near(self):
        resp = self.client.post(
            self.url,
            {"message": "places near Dhanmondi"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("Places near dhanmondi", resp.data["reply"])
        self.assertIn("Test Place", resp.data["reply"])
