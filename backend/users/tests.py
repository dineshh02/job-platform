import pytest
from rest_framework.test import APIClient

SIGNUP = '/api/auth/signup/'
LOGIN = '/api/auth/login/'


@pytest.mark.django_db
class TestSignup:
    def setup_method(self):
        self.client = APIClient()

    def test_hr_signup_returns_tokens(self):
        res = self.client.post(SIGNUP, {'email': 'hr@test.com', 'password': 'pass1234', 'role': 'hr'})
        assert res.status_code == 201
        assert 'access' in res.data
        assert 'refresh' in res.data
        assert res.data['role'] == 'hr'

    def test_candidate_signup_returns_tokens(self):
        res = self.client.post(SIGNUP, {'email': 'c@test.com', 'password': 'pass1234', 'role': 'candidate'})
        assert res.status_code == 201
        assert res.data['role'] == 'candidate'

    def test_duplicate_email_rejected(self):
        self.client.post(SIGNUP, {'email': 'dup@test.com', 'password': 'pass1234', 'role': 'hr'})
        res = self.client.post(SIGNUP, {'email': 'dup@test.com', 'password': 'pass1234', 'role': 'candidate'})
        assert res.status_code == 400

    def test_short_password_rejected(self):
        res = self.client.post(SIGNUP, {'email': 'x@test.com', 'password': '123', 'role': 'hr'})
        assert res.status_code == 400

    def test_missing_role_rejected(self):
        res = self.client.post(SIGNUP, {'email': 'x@test.com', 'password': 'pass1234'})
        assert res.status_code == 400

    def test_missing_email_rejected(self):
        res = self.client.post(SIGNUP, {'password': 'pass1234', 'role': 'hr'})
        assert res.status_code == 400


@pytest.mark.django_db
class TestLogin:
    def setup_method(self):
        self.client = APIClient()

    def test_valid_credentials_return_tokens(self, hr_user):
        res = self.client.post(LOGIN, {'email': 'hr@test.com', 'password': 'pass1234'})
        assert res.status_code == 200
        assert 'access' in res.data
        assert 'refresh' in res.data
        assert res.data['role'] == 'hr'
        assert res.data['email'] == 'hr@test.com'

    def test_wrong_password_rejected(self, hr_user):
        res = self.client.post(LOGIN, {'email': 'hr@test.com', 'password': 'wrongpass'})
        assert res.status_code == 400

    def test_nonexistent_email_rejected(self):
        res = self.client.post(LOGIN, {'email': 'nobody@test.com', 'password': 'pass1234'})
        assert res.status_code == 400
