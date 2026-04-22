from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from jobs.models import Job
from users.models import HRProfile
from embeddings import generate_embedding

User = get_user_model()


def _set_job_embedding(job, stdout, style):
    text = f'{job.title} {job.description}'
    emb = generate_embedding(text)
    if emb is not None:
        job.description_embedding = emb
        job.save(update_fields=['description_embedding'])
    else:
        stdout.write(
            style.WARNING(
                f'Skipped embedding for job "{job.title}" (set GEMINI_API_KEY for relevance sort).'
            )
        )


class Command(BaseCommand):
    help = 'Seed demo HR user, candidate user, and sample jobs'

    def handle(self, *args, **kwargs):
        hr, hr_created = User.objects.get_or_create(
            email='admin@test.com',
            defaults={'username': 'admin@test.com', 'role': 'hr'},
        )
        if hr_created:
            hr.set_password('Admin@1234')
            hr.save()
            self.stdout.write('Created HR user: admin@test.com / Admin@1234')

        hr_profile, _ = HRProfile.objects.get_or_create(
            user=hr,
            defaults={'full_name': 'Admin HR', 'company_name': 'Acme Corp'},
        )
        if not (hr_profile.company_name or '').strip():
            hr_profile.company_name = 'Acme Corp'
        if not (hr_profile.full_name or '').strip():
            hr_profile.full_name = 'Admin HR'
        hr_profile.save()

        candidate, c_created = User.objects.get_or_create(
            email='user@test.com',
            defaults={'username': 'user@test.com', 'role': 'candidate'},
        )
        if c_created:
            candidate.set_password('User@1234')
            candidate.save()
            self.stdout.write('Created candidate: user@test.com / User@1234')

        company = (hr_profile.company_name or 'Acme Corp').strip()
        if not Job.objects.exists():
            for title, description in (
                (
                    'Backend Engineer',
                    'Build and maintain REST APIs using Django and PostgreSQL.',
                ),
                (
                    'Frontend Developer',
                    'Build responsive UIs with React and Tailwind CSS.',
                ),
                (
                    'Full Stack Developer',
                    'Work across the stack: Django backend, React frontend, Docker infra.',
                ),
            ):
                job = Job.objects.create(
                    title=title,
                    company=company,
                    description=description,
                    created_by=hr,
                )
                _set_job_embedding(job, self.stdout, self.style)
            self.stdout.write('Created 3 sample jobs')
        else:
            to_embed = list(
                Job.objects.filter(created_by=hr, description_embedding__isnull=True)
            )
            for job in to_embed:
                _set_job_embedding(job, self.stdout, self.style)
            if to_embed:
                self.stdout.write(
                    self.style.NOTICE(f'Backfilled embeddings for {len(to_embed)} job(s).')
                )
