from rest_framework import serializers

from orders.models import Order
from .models import SupportMessage, SupportTicket
from .topics import TOPIC_MAP, valid_topic


class SupportMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = SupportMessage
        fields = [
            'id',
            'sender',
            'sender_role',
            'sender_name',
            'sender_username',
            'body',
            'created_at',
        ]
        read_only_fields = fields

    def get_sender_name(self, obj):
        name = f'{obj.sender.first_name} {obj.sender.last_name}'.strip()
        if name:
            return name
        if obj.sender_role == 'admin':
            return 'NovelCheckr Support'
        return obj.sender.username


class SupportTicketSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source='get_category_display', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    order_title = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True, allow_blank=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True, allow_blank=True, allow_null=True)
    messages = SupportMessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()
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
            'messages',
            'message_count',
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
            'last_message_at',
        ]
        read_only_fields = [
            'status',
            'messages',
            'message_count',
            'user_name',
            'user_username',
            'user_email',
            'user_role',
            'user_phone',
            'created_at',
            'updated_at',
            'last_message_at',
        ]

    def get_order_title(self, obj):
        if not obj.order_id:
            return None
        return obj.order.paper_title or f'Order #{obj.order_id}'

    def get_user_name(self, obj):
        name = f'{obj.user.first_name} {obj.user.last_name}'.strip()
        return name or obj.user.username

    def get_message_count(self, obj):
        if hasattr(obj, '_prefetched_objects_cache') and 'messages' in obj._prefetched_objects_cache:
            return len(obj.messages.all())
        return obj.messages.count()

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


class SupportMessageCreateSerializer(serializers.Serializer):
    body = serializers.CharField()

    def validate_body(self, value):
        body = (value or '').strip()
        if len(body) < 2:
            raise serializers.ValidationError('Please write a reply before sending.')
        if len(body) > 5000:
            raise serializers.ValidationError('Reply is too long (max 5000 characters).')
        return body
