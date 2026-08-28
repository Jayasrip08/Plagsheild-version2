from django.db import models
from orders.models import Order


class Payment(models.Model):
    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name='payment'
    )

    razorpay_order_id = models.CharField(max_length=255, db_index=True)
    razorpay_payment_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        db_index=True,
    )
    razorpay_signature = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )
    transaction_id = models.CharField(
        max_length=255,
        blank=True,
        default='',
        db_index=True,
        help_text='Bank RRN, UPI transaction ID, or card auth code from Razorpay.',
    )
    method = models.CharField(max_length=40, blank=True, default='')
    currency = models.CharField(max_length=10, default='INR')
    payer_email = models.EmailField(blank=True, default='')
    payer_contact = models.CharField(max_length=20, blank=True, default='')
    vpa = models.CharField(max_length=120, blank=True, default='')
    bank = models.CharField(max_length=80, blank=True, default='')
    card_last4 = models.CharField(max_length=8, blank=True, default='')

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    status = models.CharField(
        max_length=20,
        default='Pending'  # Pending, Paid, Failed
    )
    paid_at = models.DateTimeField(blank=True, null=True)
    gateway_payload = models.JSONField(blank=True, default=dict)

    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment #{self.id} for Order #{self.order.id} - {self.status}"
