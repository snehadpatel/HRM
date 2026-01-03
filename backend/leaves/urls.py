"""
URL patterns for leaves module.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LeaveTypeViewSet,
    LeaveBalanceView,
    LeaveRequestViewSet,
    PendingLeaveRequestsView,
)

router = DefaultRouter()
router.register('types', LeaveTypeViewSet, basename='leave-type')
router.register('requests', LeaveRequestViewSet, basename='leave-request')

urlpatterns = [
    path('balance/', LeaveBalanceView.as_view(), name='leave_balance'),
    path('pending/', PendingLeaveRequestsView.as_view(), name='pending_leaves'),
    path('', include(router.urls)),
]
