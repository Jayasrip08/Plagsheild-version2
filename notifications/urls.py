from django.urls import path
from .views import (
    SupportInboxView,
    SupportTicketListCreateView,
    SupportTicketStatusView,
    SupportTopicsView,
)

urlpatterns = [
    path('tickets/', SupportTicketListCreateView.as_view(), name='support_tickets'),
    path('topics/', SupportTopicsView.as_view(), name='support_topics'),
    path('inbox/', SupportInboxView.as_view(), name='support_inbox'),
    path('tickets/<int:pk>/', SupportTicketStatusView.as_view(), name='support_ticket_status'),
]
