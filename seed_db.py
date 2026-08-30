import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from reset_clean_db import reset_and_seed

if __name__ == '__main__':
    reset_and_seed()
