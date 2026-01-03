"""
URL patterns for payroll module.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SalaryStructureViewSet,
    SalaryTemplateViewSet,
    PaySlipViewSet,
    GeneratePaySlipsView,
)

router = DefaultRouter()
router.register('templates', SalaryTemplateViewSet, basename='salary-template')
router.register('salaries', SalaryStructureViewSet, basename='salary')
router.register('payslips', PaySlipViewSet, basename='payslip')

urlpatterns = [
    path('generate/', GeneratePaySlipsView.as_view(), name='generate_payslips'),
    path('', include(router.urls)),
]
