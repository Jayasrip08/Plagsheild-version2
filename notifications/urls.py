from django.urls import path
from .views import (
    SupportInboxView,
    SupportTicketDetailView,
    SupportTicketListCreateView,
    SupportTicketMessageCreateView,
    SupportTopicsView,
)

urlpatterns = [
    path('tickets/', SupportTicketListCreateView.as_view(), name='support_tickets'),
    path('topics/', SupportTopicsView.as_view(), name='support_topics'),
    path('inbox/', SupportInboxView.as_view(), name='support_inbox'),
    path('tickets/<int:pk>/', SupportTicketDetailView.as_view(), name='support_ticket_detail'),
    path('tickets/<int:pk>/messages/', SupportTicketMessageCreateView.as_view(), name='support_ticket_messages'),
]
