"""
Views for attendance management.
"""
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Sum, Count, Q
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdminOrHR
from employees.models import Employee
from .models import Attendance
from .serializers import (
    AttendanceSerializer, 
    CheckInSerializer, 
    CheckOutSerializer,
    AttendanceSummarySerializer
)


class CheckInView(APIView):
    """Clock in for the day."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            employee = Employee.objects.get(user=request.user)
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employee profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        today = timezone.now().date()
        
        # Check if already checked in today
        attendance, created = Attendance.objects.get_or_create(
            employee=employee,
            date=today,
            defaults={'check_in': timezone.now()}
        )
        
        if not created and attendance.check_in:
            return Response(
                {'error': 'Already checked in today', 'attendance': AttendanceSerializer(attendance).data},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not attendance.check_in:
            attendance.check_in = timezone.now()
            serializer = CheckInSerializer(data=request.data)
            if serializer.is_valid():
                attendance.notes = serializer.validated_data.get('notes', '')
            attendance.save()
        
        return Response({
            'message': 'Check-in successful',
            'attendance': AttendanceSerializer(attendance).data
        })


class CheckOutView(APIView):
    """Clock out for the day."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            employee = Employee.objects.get(user=request.user)
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employee profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        today = timezone.now().date()
        
        try:
            attendance = Attendance.objects.get(employee=employee, date=today)
        except Attendance.DoesNotExist:
            return Response(
                {'error': 'No check-in found for today'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if attendance.check_out:
            return Response(
                {'error': 'Already checked out today', 'attendance': AttendanceSerializer(attendance).data},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        attendance.check_out = timezone.now()
        serializer = CheckOutSerializer(data=request.data)
        if serializer.is_valid():
            if serializer.validated_data.get('notes'):
                attendance.notes += f"\n{serializer.validated_data['notes']}"
        attendance.save()
        
        return Response({
            'message': 'Check-out successful',
            'attendance': AttendanceSerializer(attendance).data
        })


class TodayAttendanceView(APIView):
    """Get today's attendance status."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            employee = Employee.objects.get(user=request.user)
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employee profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        today = timezone.now().date()
        
        try:
            attendance = Attendance.objects.get(employee=employee, date=today)
            return Response(AttendanceSerializer(attendance).data)
        except Attendance.DoesNotExist:
            return Response({
                'message': 'Not checked in yet',
                'date': today,
                'checked_in': False
            })


class AttendanceListView(generics.ListAPIView):
    """List attendance records."""
    
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    
    def get_queryset(self):
        user = self.request.user
        queryset = Attendance.objects.select_related('employee__user')
        
        # Admin/HR see all, employees see only their own
        if user.role not in ['admin', 'hr']:
            try:
                employee = Employee.objects.get(user=user)
                queryset = queryset.filter(employee=employee)
            except Employee.DoesNotExist:
                return Attendance.objects.none()
        
        # Apply filters
        employee_id = self.request.query_params.get('employee_id')
        employee_pk = self.request.query_params.get('employee')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        status_filter = self.request.query_params.get('status')
        
        if employee_id and user.role in ['admin', 'hr']:
            queryset = queryset.filter(employee__employee_id=employee_id)
        if employee_pk and user.role in ['admin', 'hr']:
            queryset = queryset.filter(employee__id=employee_pk)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset


class WeeklyAttendanceView(APIView):
    """Get weekly attendance summary."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            employee = Employee.objects.get(user=request.user)
        except Employee.DoesNotExist:
            # If admin/HR without profile, return empty structure (Admin view)
            today = timezone.now().date()
            start_of_week = today - timedelta(days=today.weekday())
            end_of_week = start_of_week + timedelta(days=6)
            return Response({
                'week_start': start_of_week,
                'week_end': end_of_week,
                'records': []
            })
        
        # Get date range for current week
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        
        records = Attendance.objects.filter(
            employee=employee,
            date__gte=start_of_week,
            date__lte=end_of_week
        ).order_by('date')
        
        return Response({
            'week_start': start_of_week,
            'week_end': end_of_week,
            'records': AttendanceSerializer(records, many=True).data
        })


class AttendanceSummaryView(APIView):
    """Get attendance summary for a date range."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        employee_id = request.query_params.get('employee_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Default to current month
        if not start_date:
            today = timezone.now().date()
            start_date = today.replace(day=1)
        if not end_date:
            end_date = timezone.now().date()
        
        # Get employee
        if request.user.role in ['admin', 'hr'] and employee_id:
            try:
                employee = Employee.objects.get(employee_id=employee_id)
            except Employee.DoesNotExist:
                return Response(
                    {'error': 'Employee not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            try:
                employee = Employee.objects.get(user=request.user)
            except Employee.DoesNotExist:
                return Response(
                    {'error': 'Employee profile not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        records = Attendance.objects.filter(
            employee=employee,
            date__gte=start_date,
            date__lte=end_date
        )
        
        summary = {
            'total_days': records.count(),
            'present_days': records.filter(status='present').count(),
            'absent_days': records.filter(status='absent').count(),
            'late_days': records.filter(status='late').count(),
            'half_days': records.filter(status='half_day').count(),
            'leave_days': records.filter(status='on_leave').count(),
            'total_work_hours': sum(r.work_hours for r in records),
            'average_work_hours': 0
        }
        
        if summary['total_days'] > 0:
            summary['average_work_hours'] = round(
                summary['total_work_hours'] / summary['total_days'], 2
            )
        
        return Response(summary)


class AllEmployeesAttendanceView(generics.ListAPIView):
    """Get today's attendance for all employees - Admin/HR only."""
    
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, IsAdminOrHR]
    
    def get_queryset(self):
        date = self.request.query_params.get('date', timezone.now().date())
        return Attendance.objects.filter(date=date).select_related('employee__user')
