from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView
)

from payments.views import razorpay_webhook

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Razorpay Webhook Endpoint
    path('api/razorpay/webhook/', razorpay_webhook, name='razorpay_webhook'),
    
    # API Root & Health Check
    path('', lambda request: JsonResponse({"status": "NovelCheckr API Active", "version": "1.0"})),
    path('api/', lambda request: JsonResponse({"status": "API Root Active", "endpoints": ["accounts", "colleges", "orders", "payments", "analytics", "support", "razorpay/webhook"]})),
    
    # App routers
    path('api/accounts/', include('accounts.urls')),
    path('api/colleges/', include('colleges.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/analytics/', include('analytics_app.urls')),
    path('api/support/', include('notifications.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)