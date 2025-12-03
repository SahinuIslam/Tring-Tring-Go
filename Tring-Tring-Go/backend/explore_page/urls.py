from rest_framework.routers import DefaultRouter
from .views import DestinationViewSet, ReviewViewSet

router = DefaultRouter()
router.register("destinations", DestinationViewSet, basename="destination")
router.register("reviews", ReviewViewSet, basename="review")

urlpatterns = router.urls

