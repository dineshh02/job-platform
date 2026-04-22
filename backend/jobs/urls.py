from django.urls import path
from .views import JobListView, JobCreateView, ApplyView, ApplicationListView

urlpatterns = [
    path('jobs/', JobListView.as_view()),
    path('jobs/create/', JobCreateView.as_view()),
    path('applications/', ApplyView.as_view()),
    path('applications/list/', ApplicationListView.as_view()),
]
