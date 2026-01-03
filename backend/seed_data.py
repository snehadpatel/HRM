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
            'marital_status': 'married',
            'date_of_birth': date(1988, 8, 20),
            'address': '402, Sunshine Heights, Cyber City, Bangalore, Karnataka',
            'personal_email': 'john.doe.dev@gmail.com',
            'about_me': 'Full-stack developer with over 8 years of experience building scalable web applications. Passionate about clean code and system architecture. Always eager to learn new technologies and mentor junior developers.',
            'job_passion': 'Solving complex technical challenges and optimizing system performance.',
            'interests': ['Open Source Contributing', 'Hiking', 'Photography', 'Playing Guitar'],
            'skills': ['Python', 'Django', 'React', 'PostgreSQL', 'Docker', 'AWS'],
            'bank_account': '987654321012',
            'bank_name': 'HDFC Bank',
            'ifsc_code': 'HDFC0001234',
            'pan_number': 'ABCDE1234F',
            'uan_number': '100987654321',
            'epf_code': 'MH/BAN/0012345/000/0000123',
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
            'marital_status': 'single',
            'date_of_birth': date(1996, 4, 12),
            'address': 'B-105, Crystal Plaza, Andheri West, Mumbai, Maharashtra',
            'personal_email': 'priya.codes@gmail.com',
            'about_me': 'Enthusiastic software engineer focused on frontend development and user experience. I love turning designs into responsive, interactive web pages. Big fan of modern JavaScript frameworks.',
            'job_passion': 'Creating intuitive and beautiful user interfaces that people love to use.',
            'interests': ['Travel', 'Digital Art', 'Reading Sci-Fi', 'Yoga'],
            'skills': ['JavaScript', 'React', 'TypeScript', 'CSS/SCSS', 'Figma'],
            'bank_account': '876543210987',
            'bank_name': 'ICICI Bank',
            'ifsc_code': 'ICIC0002345',
            'pan_number': 'FGHIJ5678K',
            'uan_number': '100876543210',
            'epf_code': 'MH/MUM/0054321/000/0000456',
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
            'marital_status': 'married',
            'date_of_birth': date(1990, 11, 5),
            'address': 'Flat 701, River View Apts, Pune, Maharashtra',
            'personal_email': 'amit.fin@yahoo.com',
            'about_me': 'Detail-oriented financial analyst with a strong background in data analysis and forecasting. Committed to helping the company achieve its financial goals through rigorous planning and auditing.',
            'job_passion': 'Analyzing numbers to find trends and cost-saving opportunities.',
            'interests': ['Chess', 'Stock Market Trading', 'Cricket', 'Cooking'],
            'skills': ['Financial Modeling', 'Excel', 'SAP', 'Data Analysis', 'Risk Management'],
            'bank_account': '765432109876',
            'bank_name': 'SBI',
            'ifsc_code': 'SBIN0003456',
            'pan_number': 'KLMNO9012P',
            'uan_number': '100765432109',
            'epf_code': 'MH/PUN/0098765/000/0000789',
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
            'marital_status': 'single',
            'date_of_birth': date(1992, 2, 28),
            'address': 'Sector 45, Gurgaon, Haryana',
            'personal_email': 'neha.marketing101@gmail.com',
            'about_me': 'Creative and results-driven marketing professional with a flair for digital campaigns and brand management. I thrive in fast-paced environments where I can experiment with new strategies.',
            'job_passion': 'Connecting with audiences and building a strong brand narrative.',
            'interests': ['Blogging', 'Social Media Trends', 'Traveling', 'Pottery'],
            'skills': ['Digital Marketing', 'SEO', 'Content Strategy', 'Google Analytics', 'Social Media Management'],
            'bank_account': '654321098765',
            'bank_name': 'Axis Bank',
            'ifsc_code': 'UTIB0004567',
            'pan_number': 'QRSTU3456V',
            'uan_number': '100654321098',
            'epf_code': 'HR/GUR/0011223/000/0000999',
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
                marital_status=emp_data['marital_status'],
                date_of_birth=emp_data['date_of_birth'],
                address=emp_data['address'],
                personal_email=emp_data['personal_email'],
                about_me=emp_data['about_me'],
                job_passion=emp_data['job_passion'],
                interests=emp_data['interests'],
                skills=emp_data['skills'],
                bank_account=emp_data['bank_account'],
                bank_name=emp_data['bank_name'],
                ifsc_code=emp_data['ifsc_code'],
                pan_number=emp_data['pan_number'],
                uan_number=emp_data['uan_number'],
                epf_code=emp_data['epf_code'],
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

    # Create Sample Leave Requests
    print("Creating sample leave requests...")
    import random
    from datetime import timedelta
    
    # Reload leave types
    leave_types = {lt.name: lt for lt in LeaveType.objects.all()}
    
    status_choices = ['pending', 'approved', 'rejected']
    
    # Helper to get day of week
    def is_weekend(d):
        return d.weekday() >= 5

    for emp in created_employees:
        # Create 3-5 leave requests per employee
        for _ in range(random.randint(3, 5)):
            # Random date within last 60 days or next 30 days
            days_offset = random.randint(-60, 30)
            start_date = timezone.now().date() + timedelta(days=days_offset)
            
            # Avoid starting on weekends
            while is_weekend(start_date):
                 start_date += timedelta(days=1)
            
            duration = random.randint(1, 3)
            end_date = start_date + timedelta(days=duration - 1)
            
            # Pick a random leave type
            lt_name = random.choice(list(leave_types.keys()))
            lt = leave_types[lt_name]
            
            status_val = random.choice(status_choices)
            
            # If date is in future, bias towards pending
            if start_date > timezone.now().date() and random.random() > 0.3:
                status_val = 'pending'
            
            reason = f"Personal reason for {lt_name}"
            if lt_name == 'Sick Time Off':
                reason = "Not feeling well"
            elif lt_name == 'Paid Time Off':
                reason = "Family vacation"
            
            # Check for overlapping requests? Skipping for simplicity in seeding
            
            lr = LeaveRequest.objects.create(
                employee=emp,
                leave_type=lt,
                start_date=start_date,
                end_date=end_date,
                reason=reason,
                status=status_val
            )
            
            if status_val == 'approved':
                lr.reviewed_by = hr_user
                lr.reviewed_at = timezone.now() - timedelta(days=2)
                lr.save()
                
                # Update allocation
                from leaves.models import LeaveAllocation
                alloc = LeaveAllocation.objects.filter(employee=emp, leave_type=lt, year=start_date.year).first()
                if alloc:
                    alloc.used_days += lr.total_days
                    alloc.save()
                    
            elif status_val == 'rejected':
                lr.review_notes = "Manpower shortage"
                lr.reviewed_by = hr_user
                lr.reviewed_at = timezone.now() - timedelta(days=2)
                lr.save()
                
    print("  Created sample leave requests.")

    # Create sample attendance records for last 30 days
    print("Creating sample attendance history...")
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=30)
    
    # Include HR and Admin in attendance generation if they have employee records
    all_employees = list(Employee.objects.all())
    
    import random
    
    current_date = start_date
    while current_date <= end_date:
        # Skip weekends (Saturday and Sunday)
        if current_date.weekday() >= 5:
            current_date += timedelta(days=1)
            continue
            
        for emp in all_employees:
            # 90% chance of being present
            if random.random() < 0.9:
                # Randomize check-in between 8:45 AM and 9:30 AM
                hour_in = 8
                minute_in = random.randint(45, 59)
                if random.random() > 0.5:
                    hour_in = 9
                    minute_in = random.randint(0, 30)
                
                check_in = timezone.now().replace(
                    year=current_date.year, month=current_date.month, day=current_date.day,
                    hour=hour_in, minute=minute_in, second=0, microsecond=0
                )
                
                # Randomize check-out between 5:30 PM and 7:00 PM
                hour_out = 17 # 5 PM
                minute_out = random.randint(30, 59)
                if random.random() > 0.3:
                    hour_out = 18 # 6 PM
                    minute_out = random.randint(0, 59)
                
                check_out = timezone.now().replace(
                    year=current_date.year, month=current_date.month, day=current_date.day,
                    hour=hour_out, minute=minute_out, second=0, microsecond=0
                )
                
                # Calculate work hours
                duration = check_out - check_in
                work_hours = round(Decimal(duration.total_seconds() / 3600), 2)
                
                # If today, maybe haven't checked out yet? 
                # For demo purposes, let's say everyone has checked out except a few if it's today
                is_today = (current_date == end_date)
                
                if is_today and random.random() > 0.8:
                     Attendance.objects.get_or_create(
                        employee=emp,
                        date=current_date,
                        defaults={
                            'check_in': check_in,
                            'status': 'present'
                        }
                    )
                else:
                    Attendance.objects.get_or_create(
                        employee=emp,
                        date=current_date,
                        defaults={
                            'check_in': check_in,
                            'check_out': check_out,
                            'status': 'present'
                        }
                    )
            elif random.random() < 0.05:
                # Mark as absent/leave occasionally
                Attendance.objects.get_or_create(
                    employee=emp,
                    date=current_date,
                    defaults={
                        'status': 'leave' if random.random() > 0.5 else 'absent'
                    }
                )

        current_date += timedelta(days=1)
    
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
