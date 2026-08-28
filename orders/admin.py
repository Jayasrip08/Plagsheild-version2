from django.contrib import admin
from .models import Order, PricingConfig


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'paper_title',
        'author_name',
        'user',
        'package_tier',
        'price',
        'status',
        'created_at',
    )
    list_filter = ('status', 'package_tier', 'paper_type')
    search_fields = (
        'paper_title',
        'author_name',
        'author_email',
        'user__username',
        'user__email',
        'payment__razorpay_payment_id',
        'payment__transaction_id',
    )
    readonly_fields = ('created_at',)


admin.site.register(PricingConfig)
