from django.urls import path
from .views import (
    JobListView,
    JobCreateView,
    JobMineView,
    JobApplicantsView,
    ApplyView,
    ApplicationListView,
    ApplicationStatusView,
)

urlpatterns = [
    path('jobs/', JobListView.as_view()),
    path('jobs/mine/', JobMineView.as_view()),
    path('jobs/create/', JobCreateView.as_view()),
    path('jobs/<int:pk>/applicants/', JobApplicantsView.as_view()),
    path('applications/', ApplyView.as_view()),
    path('applications/list/', ApplicationListView.as_view()),
    path('applications/<int:pk>/', ApplicationStatusView.as_view()),
]
