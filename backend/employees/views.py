"""
Views for employee management.
"""
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from accounts.permissions import IsAdminOrHR, IsOwnerOrAdminHR
from .models import Employee, Document
from .serializers import (
    EmployeeSerializer, 
    EmployeeCreateSerializer,
    EmployeeUpdateSerializer,
    DocumentSerializer
)


class EmployeeViewSet(viewsets.ModelViewSet):
    """ViewSet for employee CRUD operations."""
    
    queryset = Employee.objects.select_related('user').prefetch_related('documents')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return EmployeeCreateSerializer
        if self.action in ['update', 'partial_update']:
            return EmployeeUpdateSerializer
        return EmployeeSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAuthenticated(), IsAdminOrHR()]
        if self.action in ['update', 'partial_update']:
            return [IsAuthenticated(), IsOwnerOrAdminHR()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        # Admin and HR see all employees
        if user.role in ['admin', 'hr']:
            return self.queryset
        # Employees only see their own profile
        return self.queryset.filter(user=user)
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # Filter options
        department = request.query_params.get('department')
        employment_type = request.query_params.get('employment_type')
        search = request.query_params.get('search')
        
        if department:
            queryset = queryset.filter(department=department)
        if employment_type:
            queryset = queryset.filter(employment_type=employment_type)
        if search:
            queryset = queryset.filter(
                models.Q(user__first_name__icontains=search) |
                models.Q(user__last_name__icontains=search) |
                models.Q(employee_id__icontains=search)
            )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user's employee profile."""
        try:
            employee = Employee.objects.get(user=request.user)
            serializer = EmployeeSerializer(employee)
            return Response(serializer.data)
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employee profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        """Get employee documents."""
        employee = self.get_object()
        documents = employee.documents.all()
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data)


class DocumentUploadView(generics.CreateAPIView):
    """Upload documents for an employee."""
    
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def create(self, request, employee_id):
        try:
            employee = Employee.objects.get(id=employee_id)
            
            # Check permission
            if request.user.role not in ['admin', 'hr'] and employee.user != request.user:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(employee=employee)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employee not found'},
                status=status.HTTP_404_NOT_FOUND
            )
