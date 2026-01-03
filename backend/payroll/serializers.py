"""
Serializers for payroll management with percentage-based salary and templates.
"""
from rest_framework import serializers
from .models import SalaryStructure, SalaryTemplate, PaySlip


class SalaryTemplateSerializer(serializers.ModelSerializer):
    """Serializer for salary templates."""
    
    class Meta:
        model = SalaryTemplate
        fields = '__all__'


class SalaryStructureSerializer(serializers.ModelSerializer):
    """Serializer for salary structure."""
    
    employee_name = serializers.SerializerMethodField()
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    
    # Computed fields
    basic_salary = serializers.ReadOnlyField()
    hra = serializers.ReadOnlyField()
    performance_bonus = serializers.ReadOnlyField()
    lta = serializers.ReadOnlyField()
    gross_salary = serializers.ReadOnlyField()
    pf_employee_deduction = serializers.ReadOnlyField()
    pf_employer_contribution = serializers.ReadOnlyField()
    total_deductions = serializers.ReadOnlyField()
    net_salary = serializers.ReadOnlyField()
    yearly_wage = serializers.ReadOnlyField()
    salary_breakdown = serializers.SerializerMethodField()
    
    class Meta:
        model = SalaryStructure
        fields = [
            'id', 'employee', 'employee_id', 'employee_name',
            'template', 'template_name',
            'monthly_wage', 'yearly_wage',
            'performance_bonus_percent', 'fixed_allowance',
            # Computed amounts
            'basic_salary', 'hra', 'performance_bonus', 'lta', 'gross_salary',
            # Deductions
            'other_deductions',
            'pf_employee_deduction', 'pf_employer_contribution', 'total_deductions',
            'net_salary', 'salary_breakdown',
            # Schedule
            'working_days_per_week', 'break_time_hours', 'pay_frequency',
            'effective_from', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_employee_name(self, obj):
        return obj.employee.user.full_name
    
    def get_salary_breakdown(self, obj):
        return obj.get_salary_breakdown()


class SalaryStructureCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating salary structure."""
    
    class Meta:
        model = SalaryStructure
        fields = [
            'employee', 'template', 'monthly_wage',
            'performance_bonus_percent', 'fixed_allowance',
            'other_deductions',
            'working_days_per_week', 'break_time_hours', 'pay_frequency', 'effective_from'
        ]
    
    def validate_employee(self, value):
        # Check if employee already has salary structure (for create only)
        if not self.instance and SalaryStructure.objects.filter(employee=value, is_active=True).exists():
            raise serializers.ValidationError("Active salary structure already exists. Update existing one instead.")
        return value
    
    def validate(self, attrs):
        # Additional validation if needed
        return attrs


class PaySlipSerializer(serializers.ModelSerializer):
    """Serializer for payslips."""
    
    employee_name = serializers.SerializerMethodField()
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    
    class Meta:
        model = PaySlip
        fields = [
            'id', 'employee', 'employee_id', 'employee_name',
            'pay_period_start', 'pay_period_end', 
            'monthly_wage', 'basic_salary', 'hra', 'standard_allowance',
            'performance_bonus', 'lta', 'fixed_allowance', 'gross_salary',
            'pf_deduction', 'professional_tax', 'other_deductions', 'total_deductions',
            'net_salary', 'working_days', 'days_worked',
            'unpaid_leave_days', 'unpaid_leave_deduction',
            'status', 'payment_date', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_employee_name(self, obj):
        return obj.employee.user.full_name


class GeneratePaySlipSerializer(serializers.Serializer):
    """Serializer for generating payslips."""
    
    pay_period_start = serializers.DateField()
    pay_period_end = serializers.DateField()
    employee_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True
    )
    
    def validate(self, attrs):
        if attrs['pay_period_end'] < attrs['pay_period_start']:
            raise serializers.ValidationError("End date cannot be before start date.")
        return attrs
