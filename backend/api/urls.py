# api/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet)
router.register(r'products', views.ProductViewSet)
router.register(r'orders', views.OrderViewSet)
router.register(r'order-items', views.OrderItemViewSet)
router.register(r'payments', views.PaymentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # ✅ সার্চ এন্ডপয়েন্টস
    path('search/', views.search_products, name='search-products'),
    path('search/autocomplete/', views.autocomplete_suggestions, name='autocomplete'),
    path('search/statistics/', views.search_statistics, name='search-stats'),
    
    # ✅ পণ্যের দ্বারা সার্চ
    path('products/search/', views.ProductViewSet.as_view({'get': 'list'})),
]