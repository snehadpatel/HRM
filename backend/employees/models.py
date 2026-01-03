"""
Models for employee profiles and documents.
"""
from django.db import models
from django.conf import settings


class Employee(models.Model):
    """Employee profile linked to User account."""
    
    DEPARTMENT_CHOICES = [
        ('engineering', 'Engineering'),
        ('hr', 'Human Resources'),
        ('finance', 'Finance'),
        ('sales', 'Sales'),
        ('marketing', 'Marketing'),
        ('operations', 'Operations'),
        ('support', 'Customer Support'),
    ]
    
    EMPLOYMENT_TYPE_CHOICES = [
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('intern', 'Intern'),
    ]
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]
    
    MARITAL_STATUS_CHOICES = [
        ('single', 'Single'),
        ('married', 'Married'),
        ('divorced', 'Divorced'),
        ('widowed', 'Widowed'),
    ]
    
    # Basic Info
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='employee_profile'
    )
    employee_id = models.CharField(max_length=20, unique=True, blank=True)
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)
    position = models.CharField(max_length=100)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES, default='full_time')
    hire_date = models.DateField()
    
    # Contact Info
    phone = models.CharField(max_length=20, blank=True)
    personal_email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    
    # Manager & Location
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='direct_reports'
    )
    company_name = models.CharField(max_length=200, default='Odoo India')
    location = models.CharField(max_length=200, blank=True)
    
    # Private Info
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    marital_status = models.CharField(max_length=20, choices=MARITAL_STATUS_CHOICES, blank=True)
    
    # Bank Details
    bank_account = models.CharField(max_length=50, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    ifsc_code = models.CharField(max_length=20, blank=True)
    pan_number = models.CharField(max_length=20, blank=True)
    uan_number = models.CharField(max_length=20, blank=True)
    epf_code = models.CharField(max_length=30, blank=True)
    
    # Profile Sections
    about_me = models.TextField(blank=True)
    job_passion = models.TextField(blank=True, help_text="What I love about my job")
    interests = models.TextField(blank=True, help_text="My interests and hobbies")
    skills = models.JSONField(default=list, blank=True)
    certifications = models.JSONField(default=list, blank=True)
    
    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    
    # Media
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['employee_id']
    
    def __str__(self):
        return f"{self.employee_id} - {self.user.full_name}"
    
    def save(self, *args, **kwargs):
        if not self.employee_id and self.user:
            # Sync with User's login_id
            self.employee_id = self.user.login_id
        super().save(*args, **kwargs)
    
    def get_attendance_status(self):
        """Get today's attendance status for dashboard display."""
        from attendance.models import Attendance
        from leaves.models import LeaveRequest
        from django.utils import timezone
        
        today = timezone.now().date()
        
        # Check if on approved leave
        on_leave = LeaveRequest.objects.filter(
            employee=self,
            status='approved',
            start_date__lte=today,
            end_date__gte=today
        ).exists()
        
        if on_leave:
            return 'leave'  # Orange dot
        
        # Check if checked in today
        attendance = Attendance.objects.filter(
            employee=self,
            date=today
        ).first()
        
        if attendance and attendance.check_in:
            return 'present'  # Green dot
        
        return 'absent'  # Yellow dot


class Document(models.Model):
    """Employee documents (contracts, certificates, etc.)."""
    
    DOCUMENT_TYPE_CHOICES = [
        ('contract', 'Employment Contract'),
        ('id_proof', 'ID Proof'),
        ('certificate', 'Certificate'),
        ('leave_attachment', 'Leave Attachment'),
        ('other', 'Other'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.title} - {self.employee.employee_id}"
