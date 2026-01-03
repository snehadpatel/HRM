"""
Models for attendance tracking.
"""
from django.db import models
from django.utils import timezone
from employees.models import Employee


class Attendance(models.Model):
    """Daily attendance record for employees."""
    
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('half_day', 'Half Day'),
        ('on_leave', 'On Leave'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField(default=timezone.now)
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-check_in']
        unique_together = ['employee', 'date']
    
    def __str__(self):
        return f"{self.employee.employee_id} - {self.date}"
    
    @property
    def work_hours(self):
        """Calculate total work hours for the day."""
        if self.check_in and self.check_out:
            duration = self.check_out - self.check_in
            return round(duration.total_seconds() / 3600, 2)
        return 0
    
    def save(self, *args, **kwargs):
        # Auto-set status based on check-in time (after 9:30 AM = late)
        if self.check_in and self.status == 'present':
            if self.check_in.hour > 9 or (self.check_in.hour == 9 and self.check_in.minute > 30):
                self.status = 'late'
        super().save(*args, **kwargs)
