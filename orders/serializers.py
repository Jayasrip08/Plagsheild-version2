from rest_framework import serializers
from .models import Order, PricingConfig
from .pricing import package_from_flags, PACKAGE_LABELS
from accounts.serializers import UserSerializer
from payments.models import Payment


class PaymentSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'status',
            'amount',
            'currency',
            'method',
            'razorpay_order_id',
            'razorpay_payment_id',
            'transaction_id',
            'payer_email',
            'payer_contact',
            'vpa',
            'bank',
            'card_last4',
            'paid_at',
            'created_at',
        ]


class PricingConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingConfig
        fields = ['per_word_rate', 'express_fee', 'editing_suggestions_fee']


class OrderSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    college_name = serializers.CharField(source='college.college_name', read_only=True)
    is_expired = serializers.SerializerMethodField()
    secure_download_url = serializers.SerializerMethodField()
    report_documents = serializers.SerializerMethodField()
    package_label = serializers.SerializerMethodField()
    payment = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'user',
            'user_details',
            'document',
            'report_file',
            'report_documents',
            'word_count',
            'price',
            'similarity_score',
            'status',
            'is_express',
            'has_editing_suggestions',
            'package_tier',
            'package_label',
            'is_b2b',
            'college',
            'college_name',
            'department',
            'paper_title',
            'paper_type',
            'subject_area',
            'purpose',
            'keywords',
            'author_name',
            'author_email',
            'author_institution',
            'author_country',
            'co_authors',
            'report_uploaded_at',
            'is_expired',
            'secure_download_url',
            'created_at',
            'payment',
        ]
        read_only_fields = ['user', 'word_count', 'price', 'report_file', 'similarity_score', 'status', 'report_uploaded_at']

    def get_package_label(self, obj):
        tier = obj.package_tier or package_from_flags(obj.is_express, obj.has_editing_suggestions)
        return PACKAGE_LABELS.get(tier, 'Check — Similarity Check')

    def get_payment(self, obj):
        try:
            payment = obj.payment
        except Payment.DoesNotExist:
            return None
        return PaymentSummarySerializer(payment).data

    def get_is_expired(self, obj):
        if obj.report_uploaded_at:
            from django.utils import timezone
            from datetime import timedelta
            return timezone.now() > obj.report_uploaded_at + timedelta(hours=48)
        return False

    def get_secure_download_url(self, obj):
        if obj.report_file and obj.report_uploaded_at:
            # Generate signed token
            from django.core.signing import TimestampSigner
            signer = TimestampSigner()
            token = signer.sign(str(obj.id))
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f"/api/orders/{obj.id}/download-report/?token={token}")
            return f"/api/orders/{obj.id}/download-report/?token={token}"
        return None

    def get_report_documents(self, obj):
        import os
        from django.core.signing import TimestampSigner
        signer = TimestampSigner()
        request = self.context.get('request')
        items = []

        # From OrderReportFile
        reports = obj.report_documents.all()
        for r in reports:
            token = signer.sign(f"{obj.id}:{r.id}")
            if request:
                dl_url = request.build_absolute_uri(f"/api/orders/{obj.id}/download-report/{r.id}/?token={token}")
            else:
                dl_url = f"/api/orders/{obj.id}/download-report/{r.id}/?token={token}"

            direct_url = None
            try:
                if hasattr(r.file, 'url'):
                    direct_url = r.file.url
            except Exception:
                pass

            file_name = r.name or (os.path.basename(r.file.name) if r.file else f"Report #{r.id}")
            file_name = file_name.split('?')[0]

            items.append({
                'id': r.id,
                'name': file_name,
                'download_url': dl_url,
                'direct_url': direct_url,
            })

        # Backwards compatibility: if no OrderReportFile but legacy report_file exists
        if not items and obj.report_file:
            token = signer.sign(str(obj.id))
            if request:
                dl_url = request.build_absolute_uri(f"/api/orders/{obj.id}/download-report/?token={token}")
            else:
                dl_url = f"/api/orders/{obj.id}/download-report/?token={token}"

            direct_url = None
            try:
                if hasattr(obj.report_file, 'url'):
                    direct_url = obj.report_file.url
            except Exception:
                pass

            items.append({
                'id': 0,
                'name': os.path.basename(obj.report_file.name).split('?')[0],
                'download_url': dl_url,
                'direct_url': direct_url,
            })

        return items
