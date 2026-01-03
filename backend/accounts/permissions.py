"""
Custom permissions for role-based access control.
"""
from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Allow access only to admin users."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsHR(permissions.BasePermission):
    """Allow access only to HR users."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'hr'


class IsAdminOrHR(permissions.BasePermission):
    """Allow access to admin or HR users."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'hr']


class IsEmployee(permissions.BasePermission):
    """Allow access to regular employees."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'employee'


class IsOwnerOrAdminHR(permissions.BasePermission):
    """Allow access to record owner or admin/HR users."""
    
    def has_object_permission(self, request, view, obj):
        # Admin and HR can access any record
        if request.user.role in ['admin', 'hr']:
            return True
        
        # Check if user owns the record
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'employee') and hasattr(obj.employee, 'user'):
            return obj.employee.user == request.user
        
        return False


class ReadOnlyForEmployee(permissions.BasePermission):
    """Allow read-only access for employees, full access for admin/HR."""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admin and HR have full access
        if request.user.role in ['admin', 'hr']:
            return True
        
        # Employees can only read
        if request.user.role == 'employee':
            return request.method in permissions.SAFE_METHODS
        
        return False
