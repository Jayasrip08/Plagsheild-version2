from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsSuperAdmin
from .models import SupportTicket
from .serializers import SupportTicketSerializer
from .topics import TOPIC_MAP


def serialize_tickets(tickets, request):
    return SupportTicketSerializer(tickets, many=True, context={'request': request}).data


class SupportTicketListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tickets = SupportTicket.objects.filter(user=request.user).select_related('order', 'user')
        return Response(serialize_tickets(tickets, request))

    def post(self, request):
        serializer = SupportTicketSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        ticket = serializer.save(user=request.user)
        ticket = SupportTicket.objects.select_related('order', 'user').get(pk=ticket.pk)
        return Response(SupportTicketSerializer(ticket, context={'request': request}).data, status=status.HTTP_201_CREATED)


class SupportTopicsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(TOPIC_MAP)


class SupportInboxView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        tickets = SupportTicket.objects.select_related('order', 'user').all()
        status_filter = (request.query_params.get('status') or '').strip()
        if status_filter and status_filter != 'all':
            tickets = tickets.filter(status=status_filter)
        return Response(serialize_tickets(tickets, request))


class SupportTicketStatusView(APIView):
    permission_classes = [IsSuperAdmin]

    def patch(self, request, pk):
        try:
            ticket = SupportTicket.objects.get(pk=pk)
        except SupportTicket.DoesNotExist:
            return Response({'error': 'Request not found.'}, status=status.HTTP_404_NOT_FOUND)
        next_status = request.data.get('status')
        allowed = {choice[0] for choice in SupportTicket.STATUS_CHOICES}
        if next_status not in allowed:
            return Response({'error': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)
        ticket.status = next_status
        ticket = SupportTicket.objects.select_related('order', 'user').get(pk=ticket.pk)
        return Response(SupportTicketSerializer(ticket, context={'request': request}).data)
