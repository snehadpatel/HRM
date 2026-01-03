"""
Models for leave management.
"""
from django.db import models
from django.conf import settings
from employees.models import Employee


class LeaveType(models.Model):
    """Types of leaves available."""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    days_allowed = models.PositiveIntegerField(default=0, help_text="Annual days allowed (0 = unlimited)")
    is_paid = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class LeaveBalance(models.Model):
    """Track leave balance for each employee per leave type."""
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_balances')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    year = models.PositiveIntegerField()
    total_days = models.PositiveIntegerField(default=0)
    used_days = models.PositiveIntegerField(default=0)
    
    class Meta:
        unique_together = ['employee', 'leave_type', 'year']
        ordering = ['year', 'leave_type__name']
    
    def __str__(self):
        return f"{self.employee.employee_id} - {self.leave_type.name} ({self.year})"
    
    @property
    def remaining_days(self):
        return max(0, self.total_days - self.used_days)


class LeaveRequest(models.Model):
    """Leave request submissions."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.PROTECT)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_leaves'
    )
    review_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.employee.employee_id} - {self.leave_type.name} ({self.start_date} to {self.end_date})"
    
    @property
    def total_days(self):
        """Calculate total leave days requested."""
        if self.end_date and self.start_date:
            return (self.end_date - self.start_date).days + 1
        return 0
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.end_date < self.start_date:
            raise ValidationError("End date cannot be before start date.")
