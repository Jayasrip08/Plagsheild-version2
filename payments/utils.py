from datetime import datetime, timezone as dt_timezone


def transaction_id_from_razorpay(payload):
    acquirer = payload.get('acquirer_data') or {}
    return (
        acquirer.get('upi_transaction_id')
        or acquirer.get('rrn')
        or acquirer.get('auth_code')
        or acquirer.get('bank_transaction_id')
        or acquirer.get('transaction_id')
        or payload.get('id')
        or ''
    )


def apply_razorpay_payload(payment, payload):
    if not payload:
        return payment
    payment.razorpay_payment_id = payload.get('id') or payment.razorpay_payment_id
    payment.method = payload.get('method') or payment.method or ''
    payment.currency = payload.get('currency') or payment.currency or 'INR'
    payment.payer_email = payload.get('email') or payment.payer_email or ''
    payment.payer_contact = str(payload.get('contact') or payment.payer_contact or '')
    payment.vpa = payload.get('vpa') or payment.vpa or ''
    payment.bank = payload.get('bank') or payment.bank or ''
    card = payload.get('card') or {}
    payment.card_last4 = str(card.get('last4') or payment.card_last4 or '')
    payment.transaction_id = transaction_id_from_razorpay(payload) or payment.transaction_id
    created = payload.get('created_at')
    if created and not payment.paid_at:
        try:
            payment.paid_at = datetime.fromtimestamp(int(created), tz=dt_timezone.utc)
        except (TypeError, ValueError, OSError):
            pass
    payment.gateway_payload = payload
    return payment
