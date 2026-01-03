"""
Serializers for employee management.
"""
from rest_framework import serializers
from accounts.serializers import UserSerializer
from .models import Employee, Document


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for employee documents."""
    
    class Meta:
        model = Document
        fields = ['id', 'document_type', 'title', 'file', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class EmployeeSerializer(serializers.ModelSerializer):
    """Serializer for employee profiles."""
    
    user = UserSerializer(read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'user', 'full_name', 'department', 
            'position', 'employment_type', 'hire_date', 'phone', 
            'address', 'emergency_contact_name', 'emergency_contact_phone',
            'profile_image', 'documents', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'employee_id', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return obj.user.full_name


class EmployeeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating employee with user account."""
    
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=['employee', 'hr', 'admin'], default='employee', write_only=True)
    
    class Meta:
        model = Employee
        fields = [
            'email', 'first_name', 'last_name', 'password', 'role',
            'department', 'position', 'employment_type', 'hire_date',
            'phone', 'address', 'emergency_contact_name', 'emergency_contact_phone'
        ]
    
    def validate_email(self, value):
        from accounts.models import User
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()
    
    def create(self, validated_data):
        from accounts.models import User
        
        # Extract user data
        user_data = {
            'email': validated_data.pop('email'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'role': validated_data.pop('role'),
        }
        password = validated_data.pop('password')
        
        # Create user
        user = User.objects.create_user(password=password, **user_data)
        
        # Create employee profile
        employee = Employee.objects.create(user=user, **validated_data)
        return employee


class EmployeeUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating employee profiles."""
    
    class Meta:
        model = Employee
        fields = [
            'department', 'position', 'employment_type', 
            'phone', 'address', 'emergency_contact_name', 
            'emergency_contact_phone', 'profile_image'
        ]
