from django.urls import path
from .views import CreateRazorpayOrderView, VerifyPaymentView, razorpay_webhook

urlpatterns = [
    path('create/', CreateRazorpayOrderView.as_view(), name='payment_create'),
    path('verify/', VerifyPaymentView.as_view(), name='payment_verify'),
    path('webhook/', razorpay_webhook, name='razorpay_webhook_alt'),
]

