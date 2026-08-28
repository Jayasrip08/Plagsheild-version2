from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'order',
        'status',
        'amount',
        'razorpay_payment_id',
        'razorpay_order_id',
        'transaction_id',
        'method',
        'paid_at',
    )
    list_filter = ('status', 'method', 'currency')
    search_fields = (
        'razorpay_payment_id',
        'razorpay_order_id',
        'transaction_id',
        'order__paper_title',
        'order__author_name',
        'order__user__username',
        'order__user__email',
    )
    readonly_fields = ('created_at', 'updated_at', 'gateway_payload')
