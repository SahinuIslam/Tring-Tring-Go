from django.urls import path
from . import views

urlpatterns = [
    path('top-places/', views.top_places),
    path('places-search/', views.places_search),
    path('hospitals-near/', views.hospitals_near),
    path('police-near/', views.police_near),
    path('postoffice-near/', views.postoffice_near),
    path('chat/', views.chat),
]
