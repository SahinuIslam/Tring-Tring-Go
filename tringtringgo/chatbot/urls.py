from django.urls import path
from . import views

urlpatterns = [
    path('top-places/', views.top_places),
    path('places-search/', views.places_search),
    path('hospitals-near/', views.hospitals_near),
    path('police-near/', views.police_near),
    path('atm-near/', views.atm_near),
    path('pharmacies-near/', views.pharmacies_near),
    path('transport-near/', views.transport_near),
    path('chat/', views.chat),
]