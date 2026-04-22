from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [('hr', 'HR'), ('candidate', 'Candidate')]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)


class CandidateProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=200, blank=True)
    experience = models.TextField(blank=True)
    skills = models.CharField(max_length=500, blank=True)
    resume_file = models.FileField(upload_to='resumes/', null=True, blank=True)
    resume_text = models.TextField(blank=True)

    def __str__(self):
        return f"Profile({self.user.email})"
