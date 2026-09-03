import os
from django.core.wsgi import get_wsgi_application

if os.environ.get('VERCEL'):
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.vercel_settings')
else:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

application = get_wsgi_application()

try:
    from django.core.management import call_command
    print("[WSGI Boot] Executing database migrations...")
    call_command('migrate', interactive=False)
except Exception as e:
    print(f"[WSGI Migration Exception]: {e}")

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
    print("[SUCCESS] Ensured superadmin user 'admin' (password: Admin@innolift) on WSGI boot.")
except Exception as e:
    print(f"[WSGI Init Warning]: {e}")
