import os
import sys
import django

# Setup Django
sys.path.append('/Users/snehapatel/HRM-1/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dayflow.settings')
django.setup()

from leaves.models import LeaveRequest
from employees.models import Employee

print(f"Total Employees: {Employee.objects.count()}")
print(f"Total Leave Requests: {LeaveRequest.objects.count()}")

for lr in LeaveRequest.objects.all():
    print(f"ID: {lr.id}, Employee: {lr.employee.full_name}, Type: {lr.leave_type.name}, Status: {lr.status}")
