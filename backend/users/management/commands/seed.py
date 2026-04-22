from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from jobs.models import Job

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed demo HR user, candidate user, and sample jobs'

    def handle(self, *args, **kwargs):
        hr, hr_created = User.objects.get_or_create(
            email='hr@demo.com',
            defaults={'username': 'hr@demo.com', 'role': 'hr'},
        )
        if hr_created:
            hr.set_password('demo1234')
            hr.save()
            self.stdout.write('Created HR user: hr@demo.com / demo1234')

        candidate, c_created = User.objects.get_or_create(
            email='candidate@demo.com',
            defaults={'username': 'candidate@demo.com', 'role': 'candidate'},
        )
        if c_created:
            candidate.set_password('demo1234')
            candidate.save()
            self.stdout.write('Created candidate: candidate@demo.com / demo1234')

        if not Job.objects.exists():
            Job.objects.create(
                title='Backend Engineer',
                company='Acme Corp',
                description='Build and maintain REST APIs using Django and PostgreSQL.',
                created_by=hr,
            )
            Job.objects.create(
                title='Frontend Developer',
                company='TechCo',
                description='Build responsive UIs with React and Tailwind CSS.',
                created_by=hr,
            )
            Job.objects.create(
                title='Full Stack Developer',
                company='StartupXYZ',
                description='Work across the stack: Django backend, React frontend, Docker infra.',
                created_by=hr,
            )
            self.stdout.write('Created 3 sample jobs')
