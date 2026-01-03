"""
Models for payroll management with percentage-based salary calculation and templates.
"""
from django.db import models
from django.utils import timezone
from decimal import Decimal
from employees.models import Employee


class SalaryTemplate(models.Model):
    """
    Template for salary structure defined by Position/Grade.
    Stores the percentage breakdowns and fixed components common to a role.
    """
    name = models.CharField(max_length=100, unique=True, help_text="e.g. Software Engineer Structure")
    description = models.TextField(blank=True)
    
    # Earnings - Percentages
    basic_percent = models.DecimalField(max_digits=5, decimal_places=2, default=50.00,
                                        help_text="Basic as % of wage (e.g., 50)")
    hra_percent = models.DecimalField(max_digits=5, decimal_places=2, default=50.00,
                                      help_text="HRA as % of Basic (e.g., 50)")
    lta_percent = models.DecimalField(max_digits=5, decimal_places=2, default=8.33,
                                      help_text="LTA as % of wage")
    
    # Deductions - Percentages
    pf_employee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=12.00,
                                              help_text="PF Employee contribution % of Basic")
    pf_employer_percent = models.DecimalField(max_digits=5, decimal_places=2, default=12.00,
                                              help_text="PF Employer contribution % of Basic")
    
    # Fixed Components (Common to the Grade)
    standard_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0,
                                             help_text="Fixed standard allowance")
    professional_tax = models.DecimalField(max_digits=10, decimal_places=2, default=200,
                                           help_text="Fixed professional tax deduction")
                                           
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name


class SalaryStructure(models.Model):
    """
    Salary structure linked to an employee. 
    Connects an Employee to a SalaryTemplate and defines their specific Wage and Bonus.
    """
    
    PAY_FREQUENCY_CHOICES = [
        ('monthly', 'Monthly'),
        ('bi_weekly', 'Bi-Weekly'),
        ('weekly', 'Weekly'),
    ]
    
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='salary')
    template = models.ForeignKey(SalaryTemplate, on_delete=models.PROTECT, related_name='structures', null=True, blank=True)
    
    # Per-Employee Amounts
    monthly_wage = models.DecimalField(max_digits=12, decimal_places=2, default=0,
                                       help_text="Total monthly wage for this employee")
    
    # Bonus is unique per person (as per requirements)
    performance_bonus_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0,
                                                    help_text="Performance bonus as % of wage (Unique per person)")
    
    fixed_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0,
                                          help_text="Any other fixed allowance unique to this person")
    
    other_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Working Schedule
    working_days_per_week = models.PositiveIntegerField(default=5)
    break_time_hours = models.DecimalField(max_digits=3, decimal_places=1, default=1.0)
    
    pay_frequency = models.CharField(max_length=20, choices=PAY_FREQUENCY_CHOICES, default='monthly')
    effective_from = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.employee.employee_id} - ₹{self.net_salary}"
    
    # Helper to get template values safely
    def _get_tmpl_val(self, field, default=0):
        if self.template:
            return getattr(self.template, field)
        return Decimal(default)
    
    @property
    def basic_salary(self):
        """Calculate basic salary from percentage of wage (defined in Template)."""
        pct = self._get_tmpl_val('basic_percent', 50)
        return (self.monthly_wage * pct) / Decimal('100')
    
    @property
    def hra(self):
        """Calculate HRA from percentage of basic (defined in Template)."""
        pct = self._get_tmpl_val('hra_percent', 50)
        return (self.basic_salary * pct) / Decimal('100')
    
    @property
    def performance_bonus(self):
        """Calculate performance bonus from percentage of wage (defined on Employee)."""
        return (self.monthly_wage * self.performance_bonus_percent) / Decimal('100')
    
    @property
    def lta(self):
        """Calculate LTA from percentage of wage (defined in Template)."""
        pct = self._get_tmpl_val('lta_percent', 8.33)
        return (self.monthly_wage * pct) / Decimal('100')
        
    @property
    def standard_allowance_val(self):
        return self._get_tmpl_val('standard_allowance', 0)
        
    @property
    def professional_tax_val(self):
        return self._get_tmpl_val('professional_tax', 200)
    
    @property
    def gross_salary(self):
        """Calculate gross salary (all earnings)."""
        return (
            self.basic_salary + 
            self.hra + 
            self.standard_allowance_val +
            self.performance_bonus +
            self.lta +
            self.fixed_allowance
        )
    
    @property
    def pf_employee_deduction(self):
        """Calculate PF employee contribution."""
        pct = self._get_tmpl_val('pf_employee_percent', 12)
        return (self.basic_salary * pct) / Decimal('100')
    
    @property
    def pf_employer_contribution(self):
        """Calculate PF employer contribution (not deducted from salary)."""
        pct = self._get_tmpl_val('pf_employer_percent', 12)
        return (self.basic_salary * pct) / Decimal('100')
    
    @property
    def total_deductions(self):
        """Calculate total deductions."""
        return self.pf_employee_deduction + self.professional_tax_val + self.other_deductions
    
    @property
    def net_salary(self):
        """Calculate net salary (gross - deductions)."""
        return self.gross_salary - self.total_deductions
    
    @property
    def yearly_wage(self):
        """Calculate yearly wage."""
        return self.monthly_wage * 12
    
    def get_salary_breakdown(self):
        """Return complete salary breakdown for display."""
        if not self.template:
            return {} # Should ideally not happen if validated
            
        return {
            'monthly_wage': float(self.monthly_wage),
            'yearly_wage': float(self.yearly_wage),
            'template_name': self.template.name,
            'components': {
                'basic': {'amount': float(self.basic_salary), 'percent': float(self.template.basic_percent)},
                'hra': {'amount': float(self.hra), 'percent': float(self.template.hra_percent), 'of': 'basic'},
                'standard_allowance': {'amount': float(self.standard_allowance_val), 'type': 'fixed'},
                'performance_bonus': {'amount': float(self.performance_bonus), 'percent': float(self.performance_bonus_percent)},
                'lta': {'amount': float(self.lta), 'percent': float(self.template.lta_percent)},
                'fixed_allowance': {'amount': float(self.fixed_allowance), 'type': 'fixed'},
            },
            'gross_salary': float(self.gross_salary),
            'deductions': {
                'pf_employee': {'amount': float(self.pf_employee_deduction), 'percent': float(self.template.pf_employee_percent), 'of': 'basic'},
                'professional_tax': {'amount': float(self.professional_tax_val), 'type': 'fixed'},
                'other': {'amount': float(self.other_deductions), 'type': 'fixed'},
            },
            'total_deductions': float(self.total_deductions),
            'net_salary': float(self.net_salary),
            'pf_employer_contribution': float(self.pf_employer_contribution),
        }


class PaySlip(models.Model):
    """Monthly payslip records."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processed', 'Processed'),
        ('paid', 'Paid'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='payslips')
    pay_period_start = models.DateField()
    pay_period_end = models.DateField()
    
    # Snapshot of salary at time of generation
    monthly_wage = models.DecimalField(max_digits=12, decimal_places=2)
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    hra = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    standard_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    performance_bonus = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    lta = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fixed_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2)
    
    pf_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    professional_tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    other_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2)
    
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Attendance-based calculations
    working_days = models.PositiveIntegerField(default=0)
    days_worked = models.PositiveIntegerField(default=0)
    unpaid_leave_days = models.PositiveIntegerField(default=0)
    unpaid_leave_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-pay_period_start']
        unique_together = ['employee', 'pay_period_start', 'pay_period_end']
    
    def __str__(self):
        return f"{self.employee.employee_id} - {self.pay_period_start} to {self.pay_period_end}"
