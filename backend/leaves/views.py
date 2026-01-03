"""
Views for leave management.
"""
from django.utils import timezone
from rest_framework import viewsets, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from accounts.permissions import IsAdminOrHR
from employees.models import Employee
from .models import LeaveType, LeaveBalance, LeaveRequest
from .serializers import (
    LeaveTypeSerializer,
    LeaveBalanceSerializer,
    LeaveRequestSerializer,
    LeaveRequestCreateSerializer,
    LeaveApprovalSerializer
)


class LeaveTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for leave types - Admin/HR only for write operations."""
    
    queryset = LeaveType.objects.filter(is_active=True)
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminOrHR()]
        return [IsAuthenticated()]


class LeaveBalanceView(generics.ListAPIView):
    """Get leave balances for current employee."""
    
    serializer_class = LeaveBalanceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        year = self.request.query_params.get('year', timezone.now().year)
        
        try:
            employee = Employee.objects.get(user=self.request.user)
            return LeaveBalance.objects.filter(employee=employee, year=year)
        except Employee.DoesNotExist:
            return LeaveBalance.objects.none()


class LeaveRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for leave requests."""
    
    queryset = LeaveRequest.objects.select_related('employee__user', 'leave_type', 'reviewed_by')
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_serializer_class(self):
        if self.action == 'create':
            return LeaveRequestCreateSerializer
        return LeaveRequestSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset
        
        # Admin/HR see all requests
        if user.role not in ['admin', 'hr']:
            try:
                employee = Employee.objects.get(user=user)
                queryset = queryset.filter(employee=employee)
            except Employee.DoesNotExist:
                return LeaveRequest.objects.none()
        
        # Apply filters
        status_filter = self.request.query_params.get('status')
        employee_id = self.request.query_params.get('employee_id')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if employee_id and user.role in ['admin', 'hr']:
            queryset = queryset.filter(employee__employee_id=employee_id)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        try:
            employee = Employee.objects.get(user=request.user)
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employee profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check for overlapping leave requests
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']
        
        overlapping = LeaveRequest.objects.filter(
            employee=employee,
            status__in=['pending', 'approved'],
            start_date__lte=end_date,
            end_date__gte=start_date
        ).exists()
        
        if overlapping:
            return Response(
                {'error': 'You have an overlapping leave request for these dates'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        leave_request = serializer.save(employee=employee)
        return Response(
            LeaveRequestSerializer(leave_request).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdminOrHR])
    def approve(self, request, pk=None):
        """Approve a leave request."""
        leave_request = self.get_object()
        
        if leave_request.status != 'pending':
            return Response(
                {'error': 'Only pending requests can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Prevent self-approval
        if leave_request.employee.user == request.user:
            return Response(
                {'error': 'You cannot approve your own leave request'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = LeaveApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        leave_request.status = 'approved'
        leave_request.reviewed_by = request.user
        leave_request.review_notes = serializer.validated_data.get('review_notes', '')
        leave_request.reviewed_at = timezone.now()
        leave_request.save()
        
        # Update leave balance
        year = leave_request.start_date.year
        balance, _ = LeaveBalance.objects.get_or_create(
            employee=leave_request.employee,
            leave_type=leave_request.leave_type,
            year=year,
            defaults={'total_days': leave_request.leave_type.days_allowed}
        )
        balance.used_days += leave_request.total_days
        balance.save()
        
        return Response({
            'message': 'Leave request approved',
            'leave_request': LeaveRequestSerializer(leave_request).data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdminOrHR])
    def reject(self, request, pk=None):
        """Reject a leave request."""
        leave_request = self.get_object()
        
        if leave_request.status != 'pending':
            return Response(
                {'error': 'Only pending requests can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Prevent self-rejection (for consistency)
        if leave_request.employee.user == request.user:
            return Response(
                {'error': 'You cannot reject your own leave request'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = LeaveApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        leave_request.status = 'rejected'
        leave_request.reviewed_by = request.user
        leave_request.review_notes = serializer.validated_data.get('review_notes', '')
        leave_request.reviewed_at = timezone.now()
        leave_request.save()
        
        return Response({
            'message': 'Leave request rejected',
            'leave_request': LeaveRequestSerializer(leave_request).data
        })
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a leave request (by employee)."""
        leave_request = self.get_object()
        
        # Only pending requests can be cancelled
        if leave_request.status != 'pending':
            return Response(
                {'error': 'Only pending requests can be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Only owner can cancel
        if leave_request.employee.user != request.user:
            return Response(
                {'error': 'You can only cancel your own requests'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        leave_request.status = 'cancelled'
        leave_request.save()
        
        return Response({
            'message': 'Leave request cancelled',
            'leave_request': LeaveRequestSerializer(leave_request).data
        })


class PendingLeaveRequestsView(generics.ListAPIView):
    """List all pending leave requests - Admin/HR only."""
    
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated, IsAdminOrHR]
    
    def get_queryset(self):
        return LeaveRequest.objects.filter(status='pending').select_related(
            'employee__user', 'leave_type'
        )
