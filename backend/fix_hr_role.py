import os
import sys
import django

# Setup Django
sys.path.append('/Users/snehapatel/HRM-1/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dayflow.settings')
django.setup()

from accounts.models import User

try:
    sarah = User.objects.get(email='hr@dayflow.com')
    print(f"Current Role for {sarah.email}: {sarah.role}")
    
    if sarah.role != 'hr':
        print("Role is incorrect. Updating to 'hr'...")
        sarah.role = 'hr'
        sarah.save()
        print(f"Updated Role for {sarah.email}: {sarah.role}")
    else:
        print("Role is already correct.")

except User.DoesNotExist:
    print("User hr@dayflow.com not found.")
