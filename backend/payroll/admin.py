"""
Admin configuration for payroll module.
"""
from django.contrib import admin
from .models import SalaryStructure, PaySlip


@admin.register(SalaryStructure)
class SalaryStructureAdmin(admin.ModelAdmin):
    list_display = ['employee', 'basic_salary', 'gross_salary', 'net_salary', 'is_active', 'effective_from']
    list_filter = ['is_active', 'pay_frequency']
    search_fields = ['employee__employee_id', 'employee__user__first_name']


@admin.register(PaySlip)
class PaySlipAdmin(admin.ModelAdmin):
    list_display = ['employee', 'pay_period_start', 'pay_period_end', 'net_salary', 'status', 'payment_date']
    list_filter = ['status', 'pay_period_start']
    search_fields = ['employee__employee_id']
    date_hierarchy = 'pay_period_start'
