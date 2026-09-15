from django.db.models import Prefetch
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsSuperAdmin
from .models import SupportMessage, SupportTicket
from .serializers import (
    SupportMessageCreateSerializer,
    SupportMessageSerializer,
    SupportTicketSerializer,
)
from .topics import TOPIC_MAP


def ticket_queryset():
    return SupportTicket.objects.select_related('order', 'user').prefetch_related(
        Prefetch(
            'messages',
            queryset=SupportMessage.objects.select_related('sender').order_by('created_at'),
        )
    )


def serialize_tickets(tickets, request):
    return SupportTicketSerializer(tickets, many=True, context={'request': request}).data


def can_access_ticket(user, ticket):
    if not user or not user.is_authenticated:
        return False
    if getattr(user, 'role', '') == 'super_admin':
        return True
    return ticket.user_id == user.id


def create_opening_message(ticket):
    return SupportMessage.objects.create(
        ticket=ticket,
        sender=ticket.user,
        sender_role='user',
        body=ticket.message,
    )


class SupportTicketListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tickets = ticket_queryset().filter(user=request.user)
        return Response(serialize_tickets(tickets, request))

    def post(self, request):
        serializer = SupportTicketSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        now = timezone.now()
        ticket = serializer.save(user=request.user, last_message_at=now)
        create_opening_message(ticket)
        ticket = ticket_queryset().get(pk=ticket.pk)
        return Response(SupportTicketSerializer(ticket, context={'request': request}).data, status=status.HTTP_201_CREATED)


class SupportTopicsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(TOPIC_MAP)


class SupportInboxView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        tickets = ticket_queryset().all()
        status_filter = (request.query_params.get('status') or '').strip()
        if status_filter and status_filter != 'all':
            tickets = tickets.filter(status=status_filter)
        return Response(serialize_tickets(tickets, request))


class SupportTicketDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            ticket = ticket_queryset().get(pk=pk)
        except SupportTicket.DoesNotExist:
            return Response({'error': 'Request not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not can_access_ticket(request.user, ticket):
            return Response({'error': 'You do not have access to this request.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(SupportTicketSerializer(ticket, context={'request': request}).data)

    def patch(self, request, pk):
        if getattr(request.user, 'role', '') != 'super_admin':
            return Response({'error': 'Only Super Admin can update ticket status.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            ticket = ticket_queryset().get(pk=pk)
        except SupportTicket.DoesNotExist:
            return Response({'error': 'Request not found.'}, status=status.HTTP_404_NOT_FOUND)
        next_status = request.data.get('status')
        allowed = {choice[0] for choice in SupportTicket.STATUS_CHOICES}
        if next_status not in allowed:
            return Response({'error': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)
        ticket.status = next_status
        ticket.save(update_fields=['status', 'updated_at'])
        ticket = ticket_queryset().get(pk=ticket.pk)
        return Response(SupportTicketSerializer(ticket, context={'request': request}).data)


class SupportTicketMessageCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            ticket = ticket_queryset().get(pk=pk)
        except SupportTicket.DoesNotExist:
            return Response({'error': 'Request not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not can_access_ticket(request.user, ticket):
            return Response({'error': 'You do not have access to this request.'}, status=status.HTTP_403_FORBIDDEN)

        is_admin = getattr(request.user, 'role', '') == 'super_admin'
        if not is_admin and ticket.status == 'resolved':
            return Response(
                {'error': 'This request is resolved. Open a new request if you still need help.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = SupportMessageCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        body = serializer.validated_data['body']
        sender_role = 'admin' if is_admin else 'user'
        msg = SupportMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            sender_role=sender_role,
            body=body,
        )
        now = timezone.now()
        update_fields = ['last_message_at', 'updated_at']
        ticket.last_message_at = now
        if is_admin and ticket.status == 'open':
            ticket.status = 'in_review'
            update_fields.append('status')
        elif not is_admin and ticket.status == 'resolved':
            ticket.status = 'open'
            update_fields.append('status')
        elif not is_admin and ticket.status == 'in_review':
            # Keep in review; admin will see the new user reply.
            pass
        ticket.save(update_fields=update_fields)

        return Response(
            {
                'message': SupportMessageSerializer(msg, context={'request': request}).data,
                'ticket': SupportTicketSerializer(ticket_queryset().get(pk=ticket.pk), context={'request': request}).data,
            },
            status=status.HTTP_201_CREATED,
        )
