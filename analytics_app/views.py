from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from accounts.permissions import IsSuperAdmin
from core.firestore import get_db

class SuperAdminDashboardView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        db = get_db()

        total_registered_users = 0
        today_orders = 0
        pending_checks = 0
        total_revenue = 0.0
        spenders_dict = {}

        if db:
            try:
                # 1. Registered Users Count from Firestore
                users_docs = db.collection('users').get()
                total_registered_users = len(users_docs)

                # 2. Orders & Revenue from Firestore
                orders_docs = db.collection('orders').get()
                today_str = timezone.now().strftime("%Y-%m-%d")

                for doc in orders_docs:
                    data = doc.to_dict()
                    status_val = data.get('status', '')
                    price_val = float(data.get('price', 0.0))

                    if status_val not in ['Pending Payment']:
                        total_revenue += price_val

                    if status_val in ['Submitted', 'Processing']:
                        pending_checks += 1

                    # Count top spenders
                    username = data.get('username', 'Unknown')
                    if status_val != 'Pending Payment' and price_val > 0:
                        spenders_dict[username] = spenders_dict.get(username, 0.0) + price_val

            except Exception as e:
                print(f"Firestore Dashboard Analytics Error: {e}")

        # Top spenders list
        spenders_list = []
        for u_name, s_amount in sorted(spenders_dict.items(), key=lambda item: item[1], reverse=True)[:5]:
            spenders_list.append({
                "username": u_name,
                "total_spend": round(s_amount, 2)
            })

        return Response({
            "today_orders": today_orders,
            "total_revenue": round(total_revenue, 2),
            "b2c_revenue_total": round(total_revenue, 2),
            "b2b_revenue_total": 0.0,
            "pending_checks": pending_checks,
            "active_colleges": 0,
            "total_registered_users": total_registered_users,
            "monthly_trends": [],
            "mom_growth_percent": 0.0,
            "top_spenders": spenders_list
        })
