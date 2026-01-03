"""
Serializers for leave management.
"""
from rest_framework import serializers
from django.utils import timezone
from .models import LeaveType, LeaveBalance, LeaveRequest


class LeaveTypeSerializer(serializers.ModelSerializer):
    """Serializer for leave types."""
    
    class Meta:
        model = LeaveType
        fields = ['id', 'name', 'description', 'days_allowed', 'is_paid', 'is_active']


class LeaveBalanceSerializer(serializers.ModelSerializer):
    """Serializer for leave balance."""
    
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    remaining_days = serializers.ReadOnlyField()
    
    class Meta:
        model = LeaveBalance
        fields = ['id', 'leave_type', 'leave_type_name', 'year', 'total_days', 'used_days', 'remaining_days']


class LeaveRequestSerializer(serializers.ModelSerializer):
    """Serializer for leave requests."""
    
    employee_name = serializers.SerializerMethodField()
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()
    total_days = serializers.ReadOnlyField()
    
    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'employee', 'employee_id', 'employee_name', 
            'leave_type', 'leave_type_name', 'start_date', 'end_date',
            'total_days', 'reason', 'status', 'reviewed_by', 'reviewed_by_name',
            'review_notes', 'reviewed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'employee', 'status', 'reviewed_by', 'review_notes', 'reviewed_at', 'created_at', 'updated_at']
    
    def get_employee_name(self, obj):
        return obj.employee.user.full_name
    
    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.full_name
        return None
    
    def validate(self, attrs):
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        
        if end_date < start_date:
            raise serializers.ValidationError({"end_date": "End date cannot be before start date."})
        
        if start_date < timezone.now().date():
            raise serializers.ValidationError({"start_date": "Cannot apply for leave in the past."})
        
        return attrs


class LeaveApprovalSerializer(serializers.Serializer):
    """Serializer for leave approval/rejection."""
    
    review_notes = serializers.CharField(required=False, allow_blank=True)


class LeaveRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating leave requests."""
    
    class Meta:
        model = LeaveRequest
        fields = ['leave_type', 'start_date', 'end_date', 'reason']
    
    def validate(self, attrs):
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        
        if end_date < start_date:
            raise serializers.ValidationError({"end_date": "End date cannot be before start date."})
        
        if start_date < timezone.now().date():
            raise serializers.ValidationError({"start_date": "Cannot apply for leave in the past."})
        
        return attrs
