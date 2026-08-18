import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import User
from colleges.models import College
from orders.models import Order, PricingConfig
from payments.models import Payment

def reset_and_seed():
    print("Clearing all orders, payments, and non-essential users...")
    Payment.objects.all().delete()
    Order.objects.all().delete()
    User.objects.all().delete()
    College.objects.all().delete()
    PricingConfig.objects.all().delete()

    print("Re-seeding database with clean initial credentials...")
    
    # 1. Default Pricing Config
    PricingConfig.objects.create(
        id=1,
        per_word_rate=0.50,
        express_fee=500.00,
        editing_suggestions_fee=299.00,
        referral_credit=100.00
    )

    # 2. Super Admin
    User.objects.create_superuser(
        username='admin',
        email='admin@plagiarismplatform.com',
        password='admin123',
        role='super_admin'
    )

    # 3. Demo College
    college = College.objects.create(
        college_name="Demo B2B College",
        credits=150,
        allocated_credits=150,
        contact_email='admin@democollege.edu'
    )

    # 4. College Admin
    User.objects.create_user(
        username='college_admin',
        email='admin@democollege.edu',
        password='admin123',
        role='college_admin',
        college=college
    )

    # 5. B2B Student
    User.objects.create_user(
        username='b2b_student',
        email='student@democollege.edu',
        password='student123',
        role='user',
        college=college,
        department='Computer Science'
    )

    # 6. B2C Student
    User.objects.create_user(
        username='student_b2c',
        email='student_b2c@gmail.com',
        password='student123',
        role='user'
    )

    print("Database reset & seeding complete successfully!")

if __name__ == '__main__':
    reset_and_seed()
