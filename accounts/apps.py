from django.apps import AppConfig
from django.db.models.signals import post_migrate

def create_default_superadmin(sender, **kwargs):
    try:
        from accounts.models import User
        if not User.objects.filter(role='super_admin').exists():
            admin = User.objects.create_superuser(
                username='admin',
                email='admin@novelcheckr.com',
                password='Admin@innolift',
                role='super_admin'
            )
            print("[SUCCESS] Auto-created default superadmin user 'admin' (password: Admin@innolift)")
            try:
                from services.firestore_service import save_user_to_firestore
                save_user_to_firestore(admin)
            except Exception as e:
                print(f"Firestore Sync Warning (admin): {e}")
    except Exception as err:
        print(f"Error checking/creating default superadmin: {err}")

class AccountsConfig(AppConfig):
    name = 'accounts'

    def ready(self):
        post_migrate.connect(create_default_superadmin, sender=self)
