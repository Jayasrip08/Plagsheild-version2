from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from accounts.models import User
from orders.models import Order
from payments.models import Payment
from colleges.models import College
from accounts.permissions import IsSuperAdmin

class SuperAdminDashboardView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        now = timezone.now()
        today = now.date()

        # Key Metrics directly from PostgreSQL
        today_orders = Order.objects.filter(created_at__date=today).exclude(status='Pending Payment').count()
        b2c_revenue = Payment.objects.filter(status='Paid').aggregate(total=Sum('amount'))['total'] or 0.00
        pending_checks = Order.objects.filter(status__in=['Submitted', 'Processing']).count()
        active_colleges = College.objects.count()
        total_registered_users = User.objects.count()

        # Top Spenders
        top_spenders = User.objects.filter(role='b2c_student').annotate(
            total_spend=Sum('orders__price', filter=Q(orders__payment__status='Paid'))
        ).filter(total_spend__gt=0).order_by('-total_spend')[:5]

        spenders_list = []
        for user in top_spenders:
            spenders_list.append({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "total_spend": round(float(user.total_spend), 2)
            })

        return Response({
            "today_orders": today_orders,
            "total_revenue": round(float(b2c_revenue), 2),
            "b2c_revenue_total": round(float(b2c_revenue), 2),
            "b2b_revenue_total": 0.0,
            "pending_checks": pending_checks,
            "active_colleges": active_colleges,
            "total_registered_users": total_registered_users,
            "monthly_trends": [],
            "mom_growth_percent": 0.0,
            "top_spenders": spenders_list
        })
