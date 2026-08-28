from rest_framework import serializers

from orders.models import Order
from .models import SupportTicket
from .topics import TOPIC_MAP, valid_topic


class SupportTicketSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source='get_category_display', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    order_title = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True, allow_blank=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True, allow_blank=True, allow_null=True)
    order = serializers.PrimaryKeyRelatedField(
        queryset=Order.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = SupportTicket
        fields = [
            'id',
            'category',
            'category_label',
            'topic',
            'message',
            'order',
            'order_title',
            'status',
            'status_label',
            'user_name',
            'user_username',
            'user_email',
            'user_role',
            'user_phone',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'status',
            'user_name',
            'user_username',
            'user_email',
            'user_role',
            'user_phone',
            'created_at',
            'updated_at',
        ]

    def get_order_title(self, obj):
        if not obj.order_id:
            return None
        return obj.order.paper_title or f'Order #{obj.order_id}'

    def get_user_name(self, obj):
        name = f'{obj.user.first_name} {obj.user.last_name}'.strip()
        return name or obj.user.username

    def validate(self, attrs):
        category = attrs.get('category')
        topic = (attrs.get('topic') or '').strip()
        if not valid_topic(category, topic):
            allowed = ', '.join(TOPIC_MAP.get(category, []))
            raise serializers.ValidationError({
                'topic': f'Choose a topic for this category. Allowed: {allowed}'
            })
        attrs['topic'] = topic
        message = (attrs.get('message') or '').strip()
        if len(message) < 12:
            raise serializers.ValidationError({'message': 'Please describe your request in a little more detail.'})
        attrs['message'] = message

        request = self.context.get('request')
        order = attrs.get('order')
        if order and request:
            owns = Order.objects.filter(pk=order.pk, user=request.user).exists()
            college_owns = (
                getattr(request.user, 'role', '') == 'college_admin'
                and request.user.college_id
                and Order.objects.filter(pk=order.pk, college_id=request.user.college_id).exists()
            )
            if not owns and not college_owns:
                raise serializers.ValidationError({'order': 'You can only link a submission from your account.'})
        return attrs
