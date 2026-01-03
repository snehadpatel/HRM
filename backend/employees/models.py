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
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='employee_profile'
    )
    employee_id = models.CharField(max_length=20, unique=True)
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)
    position = models.CharField(max_length=100)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES, default='full_time')
    hire_date = models.DateField()
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['employee_id']
    
    def __str__(self):
        return f"{self.employee_id} - {self.user.full_name}"
    
    def save(self, *args, **kwargs):
        if not self.employee_id:
            # Auto-generate employee ID
            last_emp = Employee.objects.order_by('-id').first()
            if last_emp:
                last_id = int(last_emp.employee_id.replace('EMP', ''))
                self.employee_id = f"EMP{last_id + 1:04d}"
            else:
                self.employee_id = "EMP0001"
        super().save(*args, **kwargs)


class Document(models.Model):
    """Employee documents (contracts, certificates, etc.)."""
    
    DOCUMENT_TYPE_CHOICES = [
        ('contract', 'Employment Contract'),
        ('id_proof', 'ID Proof'),
        ('certificate', 'Certificate'),
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
