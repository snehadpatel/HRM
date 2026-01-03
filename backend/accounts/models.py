"""
Custom User model for Dayflow HRMS with role-based access.
"""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
import secrets
import string


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model with role-based access control."""
    
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('hr', 'HR Officer'),
        ('employee', 'Employee'),
    ]
    
    email = models.EmailField(unique=True)
    login_id = models.CharField(max_length=20, unique=True, blank=True, null=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    must_change_password = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def is_admin(self):
        return self.role == 'admin'
    
    def is_hr(self):
        return self.role == 'hr'
    
    def is_admin_or_hr(self):
        return self.role in ['admin', 'hr']
    
    @staticmethod
    def generate_login_id(first_name, last_name, company_initials='OI', year=None):
        """
        Generate login ID in format: [Company][First 2 of first name][First 2 of last name][Year][Serial]
        Example: OIJODO20230001
        """
        if year is None:
            year = timezone.now().year
        
        # Get first 2 letters of first and last name (uppercase)
        first_part = first_name[:2].upper() if len(first_name) >= 2 else first_name.upper().ljust(2, 'X')
        last_part = last_name[:2].upper() if len(last_name) >= 2 else last_name.upper().ljust(2, 'X')
        
        # Get serial number for this year
        prefix = f"{company_initials}{first_part}{last_part}{year}"
        existing_count = User.objects.filter(login_id__startswith=prefix).count()
        serial = str(existing_count + 1).zfill(4)
        
        return f"{prefix}{serial}"
    
    @staticmethod
    def generate_password(length=10):
        """Generate a random password for new employees."""
        alphabet = string.ascii_letters + string.digits + "!@#$%"
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    def save(self, *args, **kwargs):
        # Auto-generate login_id if not set
        if not self.login_id and self.first_name and self.last_name:
            self.login_id = self.generate_login_id(self.first_name, self.last_name)
        super().save(*args, **kwargs)


class CompanySettings(models.Model):
    """Company-wide settings."""
    company_name = models.CharField(max_length=200, default='Odoo India')
    company_initials = models.CharField(max_length=10, default='OI')
    logo = models.ImageField(upload_to='company/', blank=True, null=True)
    working_days_per_week = models.PositiveIntegerField(default=5)
    break_time_hours = models.DecimalField(max_digits=3, decimal_places=1, default=1.0)
    
    class Meta:
        verbose_name = 'Company Settings'
        verbose_name_plural = 'Company Settings'
    
    def __str__(self):
        return self.company_name
