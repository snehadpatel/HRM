"""
Seed data for Dayflow HRMS with new model fields.
Run with: python seed_data.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dayflow.settings')
django.setup()

from datetime import date, timedelta
from decimal import Decimal
from django.utils import timezone
from accounts.models import User, CompanySettings
from employees.models import Employee
from attendance.models import Attendance
from leaves.models import LeaveType, LeaveAllocation, LeaveRequest
from payroll.models import SalaryStructure, SalaryTemplate


def create_seed_data():
    print("Creating seed data...")
    
    # Create Company Settings
    print("Creating company settings...")
    company, _ = CompanySettings.objects.get_or_create(
        id=1,
        defaults={
            'company_name': 'Odoo India',
            'company_initials': 'OI',
            'working_days_per_week': 5,
            'break_time_hours': 1.0
        }
    )
    
    # Create Salary Templates
    print("Creating salary templates...")
    # Standard Grade
    std_template, created = SalaryTemplate.objects.get_or_create(
        name='Standard Grade',
        defaults={
            'description': 'Standard salary structure for employees',
            'basic_percent': Decimal('50'),
            'hra_percent': Decimal('50'),
            'lta_percent': Decimal('8.33'),
            'pf_employee_percent': Decimal('12'),
            'pf_employer_percent': Decimal('12'),
            'standard_allowance': Decimal('0'),
            'professional_tax': Decimal('200')
        }
    )
    if created: print(f"  Created template: {std_template.name}")
    
    # Executive Grade
    exec_template, created = SalaryTemplate.objects.get_or_create(
        name='Executive Grade',
        defaults={
            'description': 'Executive salary structure with higher allowances',
            'basic_percent': Decimal('40'),
            'hra_percent': Decimal('40'),
            'lta_percent': Decimal('10'),
            'pf_employee_percent': Decimal('12'),
            'pf_employer_percent': Decimal('12'),
            'standard_allowance': Decimal('5000'),
            'professional_tax': Decimal('200')
        }
    )
    if created: print(f"  Created template: {exec_template.name}")
    
    # Create Leave Types
    print("Creating leave types...")
    leave_types_data = [
        {'name': 'Paid Time Off', 'category': 'paid', 'description': 'Regular paid leave', 'days_allowed': 24, 'is_paid': True},
        {'name': 'Sick Time Off', 'category': 'sick', 'description': 'Medical leave', 'days_allowed': 7, 'is_paid': True, 'requires_attachment': True},
        {'name': 'Unpaid Leave', 'category': 'unpaid', 'description': 'Leave without pay', 'days_allowed': 0, 'is_paid': False},
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
        print(f"  Created admin: {admin_user.email} (Login ID: {admin_user.login_id})")
    
    # Create HR Officer
    print("Creating HR officer...")
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
            position='HR Officer',
            employment_type='full_time',
            hire_date=date(2022, 1, 15),
            phone='+91 9876543210',
            personal_email='sarah.personal@gmail.com',
            address='123 HR Street, Mumbai',
            company_name='Odoo India',
            location='Mumbai Office',
            date_of_birth=date(1990, 5, 15),
            gender='female',
            marital_status='married',
            about_me='Passionate HR professional with 5+ years experience.',
            skills=['Recruitment', 'Employee Relations', 'HRIS'],
        )
        
        SalaryStructure.objects.create(
            employee=hr_employee,
            template=exec_template,
            monthly_wage=Decimal('75000'),
            fixed_allowance=Decimal('0'),
            performance_bonus_percent=Decimal('8.33'),
            effective_from=date(2022, 1, 15)
        )
        
        # Create leave allocations
        current_year = timezone.now().year
        for lt_name, lt in leave_types.items():
            if lt.days_allowed > 0:
                LeaveAllocation.objects.create(
                    employee=hr_employee,
                    leave_type=lt,
                    year=current_year,
                    allocated_days=lt.days_allowed,
                    created_by=admin_user
                )
        
        print(f"  Created HR: {hr_user.email} (Login ID: {hr_user.login_id})")
    
    # Create Sample Employees
    print("Creating sample employees...")
    employees_data = [
        {
            'email': 'john.doe@dayflow.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'department': 'engineering',
            'position': 'Senior Software Engineer',
            'hire_date': date(2023, 1, 10),
            'phone': '+91 9876543211',
            'gender': 'male',
            'wage': 85000,
            'template': std_template
        },
        {
            'email': 'priya.patel@dayflow.com',
            'first_name': 'Priya',
            'last_name': 'Patel',
            'department': 'engineering',
            'position': 'Software Engineer',
            'hire_date': date(2023, 3, 15),
            'phone': '+91 9876543212',
            'gender': 'female',
            'wage': 65000,
            'template': std_template
        },
        {
            'email': 'amit.kumar@dayflow.com',
            'first_name': 'Amit',
            'last_name': 'Kumar',
            'department': 'finance',
            'position': 'Financial Analyst',
            'hire_date': date(2022, 9, 1),
            'phone': '+91 9876543213',
            'gender': 'male',
            'wage': 70000,
            'template': std_template
        },
        {
            'email': 'neha.singh@dayflow.com',
            'first_name': 'Neha',
            'last_name': 'Singh',
            'department': 'marketing',
            'position': 'Marketing Manager',
            'hire_date': date(2021, 11, 1),
            'phone': '+91 9876543214',
            'gender': 'female',
            'wage': 80000,
            'template': exec_template
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
                company_name='Odoo India',
                location='Mumbai Office',
                gender=emp_data['gender'],
            )
            
            SalaryStructure.objects.create(
                employee=employee,
                template=emp_data['template'],
                monthly_wage=Decimal(str(emp_data['wage'])),
                fixed_allowance=Decimal('0'),
                performance_bonus_percent=Decimal('8.33'),
                effective_from=emp_data['hire_date']
            )
            
            # Create leave allocations
            current_year = timezone.now().year
            for lt_name, lt in leave_types.items():
                if lt.days_allowed > 0:
                    LeaveAllocation.objects.create(
                        employee=employee,
                        leave_type=lt,
                        year=current_year,
                        allocated_days=lt.days_allowed,
                        created_by=admin_user
                    )
            
            created_employees.append(employee)
            print(f"  Created employee: {user.full_name} (Login ID: {user.login_id})")
    
    # Create sample attendance records for today
    print("Creating sample attendance records...")
    today = timezone.now().date()
    
    # Mark some employees as present today
    for i, employee in enumerate(created_employees[:2]):  # First 2 employees are present
        check_in_time = timezone.now().replace(hour=9, minute=0, second=0, microsecond=0)
        Attendance.objects.get_or_create(
            employee=employee,
            date=today,
            defaults={
                'check_in': check_in_time,
                'status': 'present'
            }
        )
    
    print("\nSeed data created successfully!")
    print("\n" + "="*50)
    print("TEST ACCOUNTS")
    print("="*50)
    print(f"Admin: admin@dayflow.com / admin123")
    print(f"       Login ID: {User.objects.get(email='admin@dayflow.com').login_id}")
    print(f"HR:    hr@dayflow.com / hr123456")
    print(f"       Login ID: {User.objects.get(email='hr@dayflow.com').login_id}")
    print(f"Employee: john.doe@dayflow.com / password123")
    if User.objects.filter(email='john.doe@dayflow.com').exists():
        print(f"          Login ID: {User.objects.get(email='john.doe@dayflow.com').login_id}")
    print("="*50)


if __name__ == '__main__':
    create_seed_data()
