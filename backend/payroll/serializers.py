"""
Serializers for payroll management.
"""
from rest_framework import serializers
from .models import SalaryStructure, PaySlip


class SalaryStructureSerializer(serializers.ModelSerializer):
    """Serializer for salary structure."""
    
    employee_name = serializers.SerializerMethodField()
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    gross_salary = serializers.ReadOnlyField()
    total_deductions = serializers.ReadOnlyField()
    net_salary = serializers.ReadOnlyField()
    
    class Meta:
        model = SalaryStructure
        fields = [
            'id', 'employee', 'employee_id', 'employee_name',
            'basic_salary', 'hra', 'transport_allowance', 'medical_allowance',
            'other_allowances', 'gross_salary', 'pf_deduction', 'tax_deduction',
            'other_deductions', 'total_deductions', 'net_salary', 'pay_frequency',
            'effective_from', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_employee_name(self, obj):
        return obj.employee.user.full_name


class SalaryStructureCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating salary structure."""
    
    class Meta:
        model = SalaryStructure
        fields = [
            'employee', 'basic_salary', 'hra', 'transport_allowance',
            'medical_allowance', 'other_allowances', 'pf_deduction',
            'tax_deduction', 'other_deductions', 'pay_frequency', 'effective_from'
        ]
    
    def validate_employee(self, value):
        # Check if employee already has salary structure
        if SalaryStructure.objects.filter(employee=value, is_active=True).exists():
            raise serializers.ValidationError("Active salary structure already exists for this employee.")
        return value


class PaySlipSerializer(serializers.ModelSerializer):
    """Serializer for payslips."""
    
    employee_name = serializers.SerializerMethodField()
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    
    class Meta:
        model = PaySlip
        fields = [
            'id', 'employee', 'employee_id', 'employee_name',
            'pay_period_start', 'pay_period_end', 'basic_salary',
            'hra', 'transport_allowance', 'medical_allowance', 'other_allowances',
            'gross_salary', 'pf_deduction', 'tax_deduction', 'other_deductions',
            'total_deductions', 'net_salary', 'working_days', 'days_worked',
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
