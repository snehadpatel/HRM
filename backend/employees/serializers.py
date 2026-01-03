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
    attendance_status = serializers.SerializerMethodField()
    login_id = serializers.CharField(source='user.login_id', read_only=True)
    manager_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'login_id', 'user', 'full_name', 'department', 
            'position', 'employment_type', 'hire_date', 'phone', 'personal_email',
            'address', 'company_name', 'location', 'manager', 'manager_name',
            # Private Info
            'date_of_birth', 'gender', 'marital_status',
            # Bank Details
            'bank_account', 'bank_name', 'ifsc_code', 'pan_number', 'uan_number', 'epf_code',
            # Profile
            'about_me', 'job_passion', 'interests', 'skills', 'certifications',
            # Emergency
            'emergency_contact_name', 'emergency_contact_phone',
            'profile_image', 'documents', 'attendance_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'employee_id', 'login_id', 'attendance_status', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return obj.user.full_name
    
    def get_attendance_status(self, obj):
        return obj.get_attendance_status()
    
    def get_manager_name(self, obj):
        if obj.manager:
            return obj.manager.full_name
        return None


class EmployeeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating employee with user account (by Admin/HR)."""
    
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=['employee', 'hr', 'admin'], default='employee', write_only=True)
    # Password will be auto-generated
    
    class Meta:
        model = Employee
        fields = [
            'email', 'first_name', 'last_name', 'role',
            'department', 'position', 'employment_type', 'hire_date',
            'phone', 'address', 'company_name', 'location', 'manager',
            'date_of_birth', 'gender', 'marital_status'
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
        
        # Auto-generate password
        password = User.generate_password()
        
        # Create user with auto-generated login_id and password
        user = User.objects.create_user(password=password, must_change_password=True, **user_data)
        
        # Create employee profile
        employee = Employee.objects.create(user=user, **validated_data)
        
        # Store generated password in context for response
        self.context['generated_password'] = password
        self.context['login_id'] = user.login_id
        
        return employee


class EmployeeUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating employee profiles."""
    
    class Meta:
        model = Employee
        fields = [
            'department', 'position', 'employment_type', 
            'phone', 'personal_email', 'address', 'company_name', 'location', 'manager',
            'date_of_birth', 'gender', 'marital_status',
            'bank_account', 'bank_name', 'ifsc_code', 'pan_number', 'uan_number', 'epf_code',
            'about_me', 'job_passion', 'interests', 'skills', 'certifications',
            'emergency_contact_name', 'emergency_contact_phone', 'profile_image'
        ]


class EmployeePrivateInfoSerializer(serializers.ModelSerializer):
    """Serializer for updating private info."""
    
    class Meta:
        model = Employee
        fields = [
            'date_of_birth', 'gender', 'marital_status', 'personal_email', 'address',
            'bank_account', 'bank_name', 'ifsc_code', 'pan_number', 'uan_number', 'epf_code'
        ]
