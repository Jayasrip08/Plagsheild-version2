from django.apps import AppConfig
from django.db.models.signals import post_migrate

def create_default_superadmin(sender, **kwargs):
    try:
        from accounts.models import User
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@novelcheckr.com',
                'role': 'super_admin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        admin_user.set_password('Admin@innolift')
        admin_user.email = 'admin@novelcheckr.com'
        admin_user.role = 'super_admin'
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.is_active = True
        admin_user.save()
        print("[SUCCESS] Ensured default superadmin user 'admin' (password: Admin@innolift)")
    except Exception as err:
        print(f"Error checking/creating default superadmin: {err}")

class AccountsConfig(AppConfig):
    name = 'accounts'

    def ready(self):
        post_migrate.connect(create_default_superadmin, sender=self)
