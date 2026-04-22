import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import User
from jobs.models import Job


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def hr_user(db):
    return User.objects.create_user(
        username='hr@test.com',
        email='hr@test.com',
        password='pass1234',
        role='hr',
    )


@pytest.fixture
def candidate_user(db):
    return User.objects.create_user(
        username='candidate@test.com',
        email='candidate@test.com',
        password='pass1234',
        role='candidate',
    )


@pytest.fixture
def hr_token(hr_user):
    return str(RefreshToken.for_user(hr_user).access_token)


@pytest.fixture
def candidate_token(candidate_user):
    return str(RefreshToken.for_user(candidate_user).access_token)


@pytest.fixture
def job(hr_user):
    return Job.objects.create(
        title='Software Engineer',
        description='Build great things.',
        company='Acme Corp',
        created_by=hr_user,
    )
