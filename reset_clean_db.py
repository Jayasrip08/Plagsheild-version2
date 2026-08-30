import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import User
from colleges.models import College
from orders.models import Order, PricingConfig
from payments.models import Payment

def reset_and_seed():
    print("Clearing all orders, payments, colleges, pricing configs, and users...")
    Payment.objects.all().delete()
    Order.objects.all().delete()
    User.objects.all().delete()
    College.objects.all().delete()
    PricingConfig.objects.all().delete()

    print("Re-seeding database with clean initial credentials...")
    
    # 1. Default Pricing Config
    PricingConfig.objects.create(
        id=1,
        per_word_rate=99.00,
        express_fee=299.00,
        editing_suggestions_fee=549.00
    )

    # 2. Super Admin
    User.objects.create_superuser(
        username='admin',
        email='admin@novelcheckr.com',
        password='Admin@innolift',
        role='super_admin'
    )

    # 3. B2C Student
    User.objects.create_user(
        username='student',
        email='student@gmail.com',
        password='Student@123',
        role='b2c_student'
    )

    print("Database reset & seeding complete successfully!")

if __name__ == '__main__':
    reset_and_seed()
