"""
Admin configuration for attendance module.
"""
from django.contrib import admin
from .models import Attendance


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'check_in', 'check_out', 'status', 'work_hours']
    list_filter = ['status', 'date']
    search_fields = ['employee__employee_id', 'employee__user__first_name']
    date_hierarchy = 'date'
    ordering = ['-date', '-check_in']
