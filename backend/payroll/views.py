"""
Views for payroll management.
"""
from django.utils import timezone
from rest_framework import viewsets, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from accounts.permissions import IsAdminOrHR, ReadOnlyForEmployee
from employees.models import Employee
from .models import SalaryStructure, SalaryTemplate, PaySlip
from .serializers import (
    SalaryStructureSerializer,
    SalaryStructureCreateSerializer,
    SalaryTemplateSerializer,
    PaySlipSerializer,
    GeneratePaySlipSerializer
)


class SalaryTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for salary templates - Admin/HR only."""
    queryset = SalaryTemplate.objects.all()
    serializer_class = SalaryTemplateSerializer
    permission_classes = [IsAuthenticated, IsAdminOrHR]


class SalaryStructureViewSet(viewsets.ModelViewSet):
    """ViewSet for salary structures - Admin/HR for write, read-only for employees."""
    
    queryset = SalaryStructure.objects.select_related('employee__user', 'template')
    permission_classes = [IsAuthenticated, ReadOnlyForEmployee]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SalaryStructureCreateSerializer
        return SalaryStructureSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Employees only see their own salary
        if user.role not in ['admin', 'hr']:
            try:
                employee = Employee.objects.get(user=user)
                return self.queryset.filter(employee=employee)
            except Employee.DoesNotExist:
                return SalaryStructure.objects.none()
        
        return self.queryset
    
    @action(detail=False, methods=['get'])
    def my_salary(self, request):
        """Get current user's salary structure."""
        try:
            employee = Employee.objects.get(user=request.user)
            salary = SalaryStructure.objects.filter(employee=employee, is_active=True).first()
            if salary:
                return Response(SalaryStructureSerializer(salary).data)
            return Response({'message': 'No salary structure found'}, status=status.HTTP_404_NOT_FOUND)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)


class PaySlipViewSet(viewsets.ModelViewSet):
    """ViewSet for payslips - Admin/HR for write, read-only for employees."""
    
    queryset = PaySlip.objects.select_related('employee__user')
    serializer_class = PaySlipSerializer
    permission_classes = [IsAuthenticated, ReadOnlyForEmployee]
    
    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset
        
        # Employees only see their own payslips
        if user.role not in ['admin', 'hr']:
            try:
                employee = Employee.objects.get(user=user)
                queryset = queryset.filter(employee=employee)
            except Employee.DoesNotExist:
                return PaySlip.objects.none()
        
        # Apply filters
        year = self.request.query_params.get('year')
        month = self.request.query_params.get('month')
        status_filter = self.request.query_params.get('status')
        employee_id = self.request.query_params.get('employee_id')
        
        if year:
            queryset = queryset.filter(pay_period_start__year=year)
        if month:
            queryset = queryset.filter(pay_period_start__month=month)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if employee_id and user.role in ['admin', 'hr']:
            queryset = queryset.filter(employee__employee_id=employee_id)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def my_payslips(self, request):
        """Get current user's payslips."""
        try:
            employee = Employee.objects.get(user=request.user)
            payslips = PaySlip.objects.filter(employee=employee).order_by('-pay_period_start')
            serializer = PaySlipSerializer(payslips, many=True)
            return Response(serializer.data)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAdminOrHR])
    def mark_paid(self, request, pk=None):
        """Mark a payslip as paid."""
        payslip = self.get_object()
        payslip.status = 'paid'
        payslip.payment_date = timezone.now().date()
        payslip.save()
        return Response({
            'message': 'Payslip marked as paid',
            'payslip': PaySlipSerializer(payslip).data
        })


class GeneratePaySlipsView(APIView):
    """Generate payslips for a pay period - Admin/HR only."""
    
    permission_classes = [IsAuthenticated, IsAdminOrHR]
    
    def post(self, request):
        serializer = GeneratePaySlipSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        pay_period_start = serializer.validated_data['pay_period_start']
        pay_period_end = serializer.validated_data['pay_period_end']
        employee_ids = serializer.validated_data.get('employee_ids', [])
        
        # Get employees with active salary structures
        if employee_ids:
            employees = Employee.objects.filter(id__in=employee_ids)
        else:
            employees = Employee.objects.filter(salary__is_active=True)
        
        generated = []
        skipped = []
        
        for employee in employees:
            # Check if payslip already exists
            if PaySlip.objects.filter(
                employee=employee,
                pay_period_start=pay_period_start,
                pay_period_end=pay_period_end
            ).exists():
                skipped.append(employee.employee_id)
                continue
            
            # Get salary structure
            try:
                salary = SalaryStructure.objects.get(employee=employee, is_active=True)
                # Check for template
                if not salary.template:
                    skipped.append(f"{employee.employee_id} (No Template)")
                    continue
            except SalaryStructure.DoesNotExist:
                skipped.append(employee.employee_id)
                continue
            
            # Calculate working days (assuming 5-day week)
            from datetime import timedelta
            working_days = 0
            current = pay_period_start
            while current <= pay_period_end:
                if current.weekday() < 5:  # Mon-Fri
                    working_days += 1
                current += timedelta(days=1)
            
            # Count actual days worked from attendance
            from attendance.models import Attendance
            days_worked = Attendance.objects.filter(
                employee=employee,
                date__gte=pay_period_start,
                date__lte=pay_period_end,
                status__in=['present', 'late']
            ).count()
            
            # Use computed properties from salary structure
            payslip = PaySlip.objects.create(
                employee=employee,
                pay_period_start=pay_period_start,
                pay_period_end=pay_period_end,
                monthly_wage=salary.monthly_wage,
                basic_salary=salary.basic_salary,
                hra=salary.hra,
                standard_allowance=salary.standard_allowance_val,
                performance_bonus=salary.performance_bonus,
                lta=salary.lta,
                fixed_allowance=salary.fixed_allowance,
                gross_salary=salary.gross_salary,
                pf_deduction=salary.pf_employee_deduction,
                professional_tax=salary.professional_tax_val,
                other_deductions=salary.other_deductions,
                total_deductions=salary.total_deductions,
                net_salary=salary.net_salary,
                working_days=working_days,
                days_worked=days_worked,
                status='processed'
            )
            generated.append(payslip.employee.employee_id)
        
        return Response({
            'message': f'Generated {len(generated)} payslips',
            'generated': generated,
            'skipped': skipped
        })
