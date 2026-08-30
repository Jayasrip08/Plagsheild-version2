import json
import logging
from decimal import Decimal

import razorpay
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response

from orders.models import Order
from .models import Payment
from .utils import apply_razorpay_payload

logger = logging.getLogger(__name__)


def _amount_in_paise(price) -> int:
    return int((Decimal(price) * Decimal('100')).quantize(Decimal('1')))

class CreateRazorpayOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        if not order_id:
            return Response({"error": "order_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Ensure the order belongs to the logged-in user
            order = Order.objects.get(pk=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        amount_in_paise = _amount_in_paise(order.price)

        # Fallback to simulation mode if Razorpay is not configured
        if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
            mock_order_id = f"mock_order_{order.id}_{int(timezone.now().timestamp())}"
            
            payment, created = Payment.objects.get_or_create(
                order=order,
                defaults={
                    'razorpay_order_id': mock_order_id,
                    'amount': order.price,
                    'status': 'Pending'
                }
            )
            if not created:
                payment.razorpay_order_id = mock_order_id
                payment.amount = order.price
                payment.save()

            return Response({
                "id": mock_order_id,
                "amount": amount_in_paise,
                "currency": "INR",
                "is_mock": True,
                "key": "mock_key_id"
            })

        # Real Razorpay execution
        try:
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            razorpay_order = client.order.create({
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": f"receipt_order_{order.id}",
                "notes": {
                    "platform_order_id": str(order.id),
                    "paper_title": (order.paper_title or '')[:100],
                    "author_name": (order.author_name or '')[:80],
                    "author_email": (order.author_email or '')[:80],
                    "package": order.package_tier or 'check',
                },
            })

            payment, created = Payment.objects.get_or_create(
                order=order,
                defaults={
                    'razorpay_order_id': razorpay_order['id'],
                    'amount': order.price,
                    'status': 'Pending'
                }
            )
            if not created:
                payment.razorpay_order_id = razorpay_order['id']
                payment.amount = order.price
                payment.save()

            return Response({
                "id": razorpay_order['id'],
                "amount": razorpay_order['amount'],
                "currency": razorpay_order['currency'],
                "is_mock": False,
                "key": settings.RAZORPAY_KEY_ID
            })
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {e}", exc_info=True)
            err_msg = str(e)
            if "Authentication failed" in err_msg:
                err_msg = "Razorpay Authentication failed. Please verify your Key ID and Key Secret in Razorpay Dashboard (API Keys section) and ensure Live mode is activated."
            return Response({"error": f"Razorpay connection failed: {err_msg}"}, status=status.HTTP_400_BAD_REQUEST)


class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        payment_id = request.data.get('razorpay_payment_id')
        signature = request.data.get('razorpay_signature')
        razorpay_order_id = request.data.get('razorpay_order_id')

        if not razorpay_order_id or not payment_id:
            return Response({"error": "Missing signature verification details"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.select_related('order').get(razorpay_order_id=razorpay_order_id)
            order = payment.order
            if order.user_id != request.user.id:
                raise Payment.DoesNotExist
        except Payment.DoesNotExist:
            return Response({"error": "Payment records for this order ID do not exist"}, status=status.HTTP_404_NOT_FOUND)

        # Fallback verification for simulation
        if razorpay_order_id.startswith('mock_') or not settings.RAZORPAY_KEY_ID:
            payment.razorpay_payment_id = payment_id
            payment.razorpay_signature = signature or "mocked_signature"
            payment.transaction_id = payment_id
            payment.method = 'mock'
            payment.status = 'Paid'
            payment.paid_at = timezone.now()
            payment.save()

            order.status = 'Submitted'
            order.save()

            return Response({
                "status": "Payment verified (Mocked)",
                "order_id": order.id,
                "payment_status": payment.status
            })

        # Real verification using Razorpay SDK
        try:
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            params_dict = {
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': payment_id,
                'razorpay_signature': signature
            }
            client.utility.verify_payment_signature(params_dict)

            payment.razorpay_payment_id = payment_id
            payment.razorpay_signature = signature
            payment.status = 'Paid'
            payment.paid_at = timezone.now()
            try:
                captured = client.payment.fetch(payment_id)
                apply_razorpay_payload(payment, captured)
            except Exception:
                payment.transaction_id = payment.transaction_id or payment_id
            payment.save()

            order.status = 'Submitted'
            order.save()

            return Response({
                "status": "Payment verified",
                "order_id": order.id,
                "payment_status": payment.status
            })
        except Exception as e:
            payment.status = 'Failed'
            payment.save()
            return Response({"error": f"Razorpay signature check failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def razorpay_webhook(request):
    """
    Razorpay Webhook Handler Endpoint: /api/razorpay/webhook/
    Processes payment.captured, order.paid, and payment.failed events from Razorpay servers.

    Security note: verification is mandatory, not optional. Do not weaken this to
    "verify only if a secret/signature happens to be present" — that lets anyone who
    knows (or brute-forces) a razorpay_order_id POST a forged payment.captured event
    with no signature at all and have it trusted as a real payment. The webhook secret
    is set separately from the API key secret (Razorpay Dashboard > Settings > Webhooks
    > your webhook > Secret) and must never fall back to RAZORPAY_KEY_SECRET — they are
    different values and a real webhook signed with the webhook secret will not verify
    against the API key secret.
    """
    webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
    if not webhook_secret:
        logger.error("Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not configured.")
        return Response({"error": "Webhook not configured"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    webhook_signature = request.headers.get('X-Razorpay-Signature', '')
    if not webhook_signature:
        logger.warning("Razorpay webhook rejected: missing X-Razorpay-Signature header.")
        return Response({"error": "Missing signature"}, status=status.HTTP_400_BAD_REQUEST)

    payload_body = request.body.decode('utf-8')

    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    try:
        client.utility.verify_webhook_signature(payload_body, webhook_signature, webhook_secret)
    except razorpay.errors.SignatureVerificationError:
        logger.warning("Razorpay webhook rejected: signature verification failed.")
        return Response({"error": "Invalid webhook signature"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        data = json.loads(payload_body) if payload_body else {}
    except json.JSONDecodeError:
        return Response({"error": "Invalid JSON payload"}, status=status.HTTP_400_BAD_REQUEST)

    event = data.get('event', '')
    payload_entity = data.get('payload', {}).get('payment', {}).get('entity', {})
    razorpay_order_id = payload_entity.get('order_id')
    razorpay_payment_id = payload_entity.get('id')

    if razorpay_order_id:
        try:
            payment = Payment.objects.select_related('order').get(razorpay_order_id=razorpay_order_id)
            order = payment.order

            if event in ['payment.captured', 'order.paid']:
                if payment.status != 'Paid':
                    payment.status = 'Paid'
                    payment.razorpay_payment_id = razorpay_payment_id or payment.razorpay_payment_id
                    payment.paid_at = payment.paid_at or timezone.now()
                    apply_razorpay_payload(payment, payload_entity)
                    payment.save()

                    if order.status == 'Pending Payment':
                        order.status = 'Submitted'
                        order.save()
                    logger.info(f"Webhook updated order #{order.id} to Paid & Submitted.")
                # else: already confirmed (e.g. by the client-side verify call) — idempotent no-op.

            elif event == 'payment.failed':
                if payment.status != 'Paid':
                    payment.status = 'Failed'
                    payment.gateway_payload = payload_entity
                    payment.save()
                    logger.info(f"Webhook marked payment for order #{order.id} as Failed.")
                # else: never downgrade a payment already confirmed as paid.

        except Payment.DoesNotExist:
            logger.warning(f"Webhook received for untracked razorpay_order_id: {razorpay_order_id}")

    return Response({"status": "Webhook processed successfully", "event": event}, status=status.HTTP_200_OK)

