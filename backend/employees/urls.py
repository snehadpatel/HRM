"""
URL patterns for employees module.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet, DocumentUploadView

router = DefaultRouter()
router.register('', EmployeeViewSet, basename='employee')

urlpatterns = [
    path('<int:employee_id>/documents/upload/', DocumentUploadView.as_view(), name='upload_document'),
    path('', include(router.urls)),
]
