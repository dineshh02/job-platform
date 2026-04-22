import pytest
from rest_framework.test import APIClient
from users.models import User
from jobs.models import Job, Application

JOBS_LIST = '/api/jobs/'
JOBS_CREATE = '/api/jobs/create/'
APPLY = '/api/applications/'
APPLICATIONS_LIST = '/api/applications/list/'


@pytest.mark.django_db
class TestJobList:
    def test_authenticated_user_can_list_jobs(self, hr_token):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {hr_token}')
        res = client.get(JOBS_LIST)
        assert res.status_code == 200
        assert isinstance(res.data, list)

    def test_unauthenticated_cannot_list_jobs(self):
        res = APIClient().get(JOBS_LIST)
        assert res.status_code == 401

    def test_candidate_can_list_jobs(self, candidate_token, job):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {candidate_token}')
        res = client.get(JOBS_LIST)
        assert res.status_code == 200
        assert len(res.data) == 1
        assert res.data[0]['title'] == job.title


@pytest.mark.django_db
class TestJobCreate:
    def test_hr_can_create_job(self, hr_token):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {hr_token}')
        res = client.post(JOBS_CREATE, {'title': 'Engineer', 'description': 'Great role', 'company': 'Acme'})
        assert res.status_code == 201
        assert res.data['title'] == 'Engineer'

    def test_created_by_set_from_token(self, hr_token, hr_user):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {hr_token}')
        res = client.post(JOBS_CREATE, {'title': 'Dev', 'description': 'Cool job', 'company': 'Corp'})
        assert res.status_code == 201
        assert res.data['created_by'] == str(hr_user)

    def test_candidate_cannot_create_job(self, candidate_token):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {candidate_token}')
        res = client.post(JOBS_CREATE, {'title': 'Engineer', 'description': 'Great role', 'company': 'Acme'})
        assert res.status_code == 403

    def test_unauthenticated_cannot_create_job(self):
        res = APIClient().post(JOBS_CREATE, {'title': 'Engineer', 'description': 'Great role', 'company': 'Acme'})
        assert res.status_code == 401

    def test_missing_fields_rejected(self, hr_token):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {hr_token}')
        res = client.post(JOBS_CREATE, {'title': 'Only title'})
        assert res.status_code == 400


@pytest.mark.django_db
class TestApply:
    def test_candidate_can_apply(self, candidate_token, job):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {candidate_token}')
        res = client.post(APPLY, {'job': job.id})
        assert res.status_code == 201
        assert res.data['status'] == 'applied'

    def test_hr_cannot_apply(self, hr_token, job):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {hr_token}')
        res = client.post(APPLY, {'job': job.id})
        assert res.status_code == 403

    def test_unauthenticated_cannot_apply(self, job):
        res = APIClient().post(APPLY, {'job': job.id})
        assert res.status_code == 401

    def test_duplicate_application_rejected(self, candidate_token, job):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {candidate_token}')
        client.post(APPLY, {'job': job.id})
        res = client.post(APPLY, {'job': job.id})
        assert res.status_code == 400

    def test_apply_to_nonexistent_job_rejected(self, candidate_token):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {candidate_token}')
        res = client.post(APPLY, {'job': 9999})
        assert res.status_code == 400


@pytest.mark.django_db
class TestApplicationList:
    def test_hr_sees_applications_for_own_jobs(self, hr_token, candidate_user, job):
        Application.objects.create(user=candidate_user, job=job)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {hr_token}')
        res = client.get(APPLICATIONS_LIST)
        assert res.status_code == 200
        assert len(res.data) == 1

    def test_hr_cannot_see_other_hrs_applications(self, hr_token, candidate_user, db):
        other_hr = User.objects.create_user(
            username='other@hr.com', email='other@hr.com', password='pass1234', role='hr'
        )
        other_job = Job.objects.create(title='Other Job', description='...', company='Other', created_by=other_hr)
        Application.objects.create(user=candidate_user, job=other_job)

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {hr_token}')
        res = client.get(APPLICATIONS_LIST)
        assert res.status_code == 200
        assert len(res.data) == 0

    def test_candidate_cannot_list_applications(self, candidate_token):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {candidate_token}')
        res = client.get(APPLICATIONS_LIST)
        assert res.status_code == 403

    def test_unauthenticated_cannot_list_applications(self):
        res = APIClient().get(APPLICATIONS_LIST)
        assert res.status_code == 401
