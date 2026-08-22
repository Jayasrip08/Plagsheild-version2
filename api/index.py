import os
import django
from django.core.management import call_command

if os.environ.get('VERCEL'):
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.vercel_settings')
else:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

django.setup()

try:
    print("Running migrations...")
    call_command('migrate', interactive=False)
    from colleges.models import College
    if not College.objects.filter(college_name="Demo B2B College").exists():
        print("Seeding database...")
        from seed_db import seed
        seed()
except Exception as e:
    print("Migration/Seeding failed:", e)

from core.wsgi import application
app = application
