"""
Seed data for Dayflow HRMS.
Run with: python manage.py shell < seed_data.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dayflow.settings')
django.setup()

from datetime import date, timedelta
from django.utils import timezone
from accounts.models import User
from employees.models import Employee
from attendance.models import Attendance
from leaves.models import LeaveType, LeaveBalance, LeaveRequest
from payroll.models import SalaryStructure


def create_seed_data():
    print("Creating seed data...")
    
    # Create Leave Types
    print("Creating leave types...")
    leave_types_data = [
        {'name': 'Annual Leave', 'description': 'Regular annual vacation leave', 'days_allowed': 20, 'is_paid': True},
        {'name': 'Sick Leave', 'description': 'Medical/health related leave', 'days_allowed': 12, 'is_paid': True},
        {'name': 'Personal Leave', 'description': 'Personal matters', 'days_allowed': 5, 'is_paid': True},
        {'name': 'Maternity Leave', 'description': 'Maternity leave for new mothers', 'days_allowed': 90, 'is_paid': True},
        {'name': 'Paternity Leave', 'description': 'Paternity leave for new fathers', 'days_allowed': 15, 'is_paid': True},
        {'name': 'Unpaid Leave', 'description': 'Leave without pay', 'days_allowed': 0, 'is_paid': False},
    ]
    
    leave_types = {}
    for lt_data in leave_types_data:
        lt, created = LeaveType.objects.get_or_create(name=lt_data['name'], defaults=lt_data)
        leave_types[lt.name] = lt
        if created:
            print(f"  Created leave type: {lt.name}")
    
    # Create Admin User
    print("Creating admin user...")
    admin_user, created = User.objects.get_or_create(
        email='admin@dayflow.com',
        defaults={
            'first_name': 'System',
            'last_name': 'Admin',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print(f"  Created admin: {admin_user.email}")
    
    # Create HR Manager
    print("Creating HR manager...")
    hr_user, created = User.objects.get_or_create(
        email='hr@dayflow.com',
        defaults={
            'first_name': 'Sarah',
            'last_name': 'Johnson',
            'role': 'hr',
        }
    )
    if created:
        hr_user.set_password('hr123456')
        hr_user.save()
        
        hr_employee = Employee.objects.create(
            user=hr_user,
            department='hr',
            position='HR Manager',
            employment_type='full_time',
            hire_date=date(2022, 1, 15),
            phone='+91 9876543210',
            address='123 HR Street, Mumbai'
        )
        
        SalaryStructure.objects.create(
            employee=hr_employee,
            basic_salary=75000,
            hra=15000,
            transport_allowance=5000,
            medical_allowance=3000,
            pf_deduction=9000,
            tax_deduction=8000,
            effective_from=date(2022, 1, 15)
        )
        print(f"  Created HR: {hr_user.email}")
    
    # Create Sample Employees
    print("Creating sample employees...")
    employees_data = [
        {
            'email': 'rahul.sharma@dayflow.com',
            'first_name': 'Rahul',
            'last_name': 'Sharma',
            'department': 'engineering',
            'position': 'Senior Software Engineer',
            'hire_date': date(2021, 6, 1),
            'phone': '+91 9876543211',
            'salary': {'basic': 85000, 'hra': 17000, 'transport': 5000, 'medical': 5000, 'pf': 10200, 'tax': 12000}
        },
        {
            'email': 'priya.patel@dayflow.com',
            'first_name': 'Priya',
            'last_name': 'Patel',
            'department': 'engineering',
            'position': 'Software Engineer',
            'hire_date': date(2022, 3, 15),
            'phone': '+91 9876543212',
            'salary': {'basic': 65000, 'hra': 13000, 'transport': 4000, 'medical': 3000, 'pf': 7800, 'tax': 8000}
        },
        {
            'email': 'amit.kumar@dayflow.com',
            'first_name': 'Amit',
            'last_name': 'Kumar',
            'department': 'finance',
            'position': 'Financial Analyst',
            'hire_date': date(2021, 9, 1),
            'phone': '+91 9876543213',
            'salary': {'basic': 70000, 'hra': 14000, 'transport': 4500, 'medical': 3500, 'pf': 8400, 'tax': 9000}
        },
        {
            'email': 'neha.singh@dayflow.com',
            'first_name': 'Neha',
            'last_name': 'Singh',
            'department': 'marketing',
            'position': 'Marketing Manager',
            'hire_date': date(2020, 11, 1),
            'phone': '+91 9876543214',
            'salary': {'basic': 80000, 'hra': 16000, 'transport': 5000, 'medical': 4000, 'pf': 9600, 'tax': 11000}
        },
        {
            'email': 'vikram.joshi@dayflow.com',
            'first_name': 'Vikram',
            'last_name': 'Joshi',
            'department': 'operations',
            'position': 'Operations Lead',
            'hire_date': date(2022, 7, 15),
            'phone': '+91 9876543215',
            'salary': {'basic': 72000, 'hra': 14400, 'transport': 4500, 'medical': 3500, 'pf': 8640, 'tax': 9500}
        },
    ]
    
    created_employees = []
    for emp_data in employees_data:
        user, created = User.objects.get_or_create(
            email=emp_data['email'],
            defaults={
                'first_name': emp_data['first_name'],
                'last_name': emp_data['last_name'],
                'role': 'employee',
            }
        )
        
        if created:
            user.set_password('password123')
            user.save()
            
            employee = Employee.objects.create(
                user=user,
                department=emp_data['department'],
                position=emp_data['position'],
                employment_type='full_time',
                hire_date=emp_data['hire_date'],
                phone=emp_data['phone'],
            )
            
            salary = emp_data['salary']
            SalaryStructure.objects.create(
                employee=employee,
                basic_salary=salary['basic'],
                hra=salary['hra'],
                transport_allowance=salary['transport'],
                medical_allowance=salary['medical'],
                pf_deduction=salary['pf'],
                tax_deduction=salary['tax'],
                effective_from=emp_data['hire_date']
            )
            
            # Create leave balances
            current_year = timezone.now().year
            for lt_name, lt in leave_types.items():
                if lt.days_allowed > 0:
                    LeaveBalance.objects.create(
                        employee=employee,
                        leave_type=lt,
                        year=current_year,
                        total_days=lt.days_allowed,
                        used_days=0
                    )
            
            created_employees.append(employee)
            print(f"  Created employee: {user.full_name}")
    
    # Create sample attendance records for this week
    print("Creating sample attendance records...")
    today = timezone.now().date()
    start_of_week = today - timedelta(days=today.weekday())
    
    for employee in created_employees:
        for i in range(min(today.weekday() + 1, 5)):  # Only weekdays up to today
            day = start_of_week + timedelta(days=i)
            if day <= today:
                check_in_time = timezone.now().replace(
                    year=day.year, month=day.month, day=day.day,
                    hour=9, minute=0, second=0, microsecond=0
                )
                check_out_time = check_in_time.replace(hour=18, minute=0)
                
                if day < today:
                    Attendance.objects.get_or_create(
                        employee=employee,
                        date=day,
                        defaults={
                            'check_in': check_in_time,
                            'check_out': check_out_time,
                            'status': 'present'
                        }
                    )
    
    print("\nSeed data created successfully!")
    print("\nTest Accounts:")
    print("  Admin: admin@dayflow.com / admin123")
    print("  HR: hr@dayflow.com / hr123456")
    print("  Employee: rahul.sharma@dayflow.com / password123")
    print("  Employee: priya.patel@dayflow.com / password123")


if __name__ == '__main__':
    create_seed_data()
