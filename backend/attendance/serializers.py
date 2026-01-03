"""
Serializers for attendance management.
"""
from rest_framework import serializers
from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for attendance records."""
    
    employee_name = serializers.SerializerMethodField()
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    work_hours = serializers.ReadOnlyField()
    
    class Meta:
        model = Attendance
        fields = [
            'id', 'employee', 'employee_id', 'employee_name', 'date',
            'check_in', 'check_out', 'status', 'work_hours', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'work_hours']
    
    def get_employee_name(self, obj):
        return obj.employee.user.full_name


class CheckInSerializer(serializers.Serializer):
    """Serializer for check-in action."""
    
    notes = serializers.CharField(required=False, allow_blank=True)


class CheckOutSerializer(serializers.Serializer):
    """Serializer for check-out action."""
    
    notes = serializers.CharField(required=False, allow_blank=True)


class AttendanceSummarySerializer(serializers.Serializer):
    """Serializer for attendance summary."""
    
    total_days = serializers.IntegerField()
    present_days = serializers.IntegerField()
    absent_days = serializers.IntegerField()
    late_days = serializers.IntegerField()
    half_days = serializers.IntegerField()
    leave_days = serializers.IntegerField()
    total_work_hours = serializers.FloatField()
    average_work_hours = serializers.FloatField()
