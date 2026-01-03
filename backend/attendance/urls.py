"""
URL patterns for attendance module.
"""
from django.urls import path
from .views import (
    CheckInView,
    CheckOutView,
    TodayAttendanceView,
    AttendanceListView,
    WeeklyAttendanceView,
    AttendanceSummaryView,
    AllEmployeesAttendanceView,
)

urlpatterns = [
    path('check-in/', CheckInView.as_view(), name='check_in'),
    path('check-out/', CheckOutView.as_view(), name='check_out'),
    path('today/', TodayAttendanceView.as_view(), name='today_attendance'),
    path('weekly/', WeeklyAttendanceView.as_view(), name='weekly_attendance'),
    path('summary/', AttendanceSummaryView.as_view(), name='attendance_summary'),
    path('all/', AllEmployeesAttendanceView.as_view(), name='all_attendance'),
    path('', AttendanceListView.as_view(), name='attendance_list'),
]
