"""
Admin configuration for employees module.
"""
from django.contrib import admin
from .models import Employee, Document


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'get_full_name', 'department', 'position', 'hire_date']
    list_filter = ['department', 'employment_type']
    search_fields = ['employee_id', 'user__first_name', 'user__last_name', 'user__email']
    ordering = ['employee_id']
    
    def get_full_name(self, obj):
        return obj.user.full_name
    get_full_name.short_description = 'Name'


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'employee', 'document_type', 'uploaded_at']
    list_filter = ['document_type']
    search_fields = ['title', 'employee__employee_id']
