from django.shortcuts import get_object_or_404
from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from users.models import HRProfile, CandidateProfile
from .models import Job, Application
from .serializers import JobSerializer, JobMineSerializer, ApplicationSerializer
from .permissions import IsHR, IsCandidate
from embeddings import generate_embedding, cosine_similarity


class JobListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        jobs = list(Job.objects.all().order_by('-created_at'))
        sort = request.query_params.get('sort')
        profile_embedding = None

        if sort == 'relevance' and request.user.role == 'candidate':
            try:
                profile_embedding = request.user.profile.resume_embedding
            except Exception:
                pass

        for job in jobs:
            if profile_embedding and job.description_embedding:
                score = cosine_similarity(profile_embedding, job.description_embedding)
                job.match_score = round(score * 100)
            else:
                job.match_score = None

        if sort == 'relevance' and profile_embedding:
            jobs.sort(key=lambda j: j.match_score or 0, reverse=True)

        return Response(JobSerializer(jobs, many=True).data)


class JobCreateView(APIView):
    permission_classes = [IsHR]

    def post(self, request):
        try:
            hr_profile = request.user.hrprofile
        except HRProfile.DoesNotExist:
            return Response(
                {'detail': 'Complete your HR profile with company name before posting jobs.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        company_name = (hr_profile.company_name or '').strip()
        if not company_name:
            return Response(
                {'detail': 'Company name is required on your HR profile.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = JobSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job = serializer.save(created_by=request.user, company=company_name)
        job.description_embedding = generate_embedding(f"{job.title} {job.description}")
        job.save(update_fields=['description_embedding'])
        return Response(JobSerializer(job).data, status=status.HTTP_201_CREATED)


class ApplyView(APIView):
    permission_classes = [IsCandidate]

    def get(self, request):
        applications = Application.objects.filter(user=request.user)
        return Response(ApplicationSerializer(applications, many=True).data)

    def post(self, request):
        serializer = ApplicationSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ApplicationListView(APIView):
    permission_classes = [IsHR]

    def get(self, request):
        applications = Application.objects.filter(
            job__created_by=request.user
        ).select_related('user', 'job')
        return Response(ApplicationSerializer(applications, many=True).data)


class JobMineView(APIView):
    permission_classes = [IsHR]

    def get(self, request):
        jobs = (
            Job.objects.filter(created_by=request.user)
            .annotate(applicant_count=Count('applications'))
            .order_by('-created_at')
        )
        return Response(JobMineSerializer(jobs, many=True).data)


class JobApplicantsView(APIView):
    permission_classes = [IsHR]

    def get(self, request, pk):
        job = get_object_or_404(Job, pk=pk, created_by=request.user)
        applications = Application.objects.filter(job=job).select_related('user').order_by('-applied_at')
        applicants = []
        for app in applications:
            user = app.user
            prof = CandidateProfile.objects.filter(user=user).first()
            # Relative path so the browser resolves media against the same host/port as the API
            # (avoids broken iframes when the server hostname is internal, e.g. Docker service name).
            resume_url = None
            if prof and prof.resume_file:
                resume_url = prof.resume_file.url
            applicants.append({
                'application_id': app.id,
                'status': app.status,
                'applied_at': app.applied_at,
                'user_id': user.id,
                'email': user.email,
                'full_name': prof.full_name if prof else '',
                'skills': prof.skills if prof else '',
                'years_of_experience': prof.years_of_experience if prof else None,
                'resume_url': resume_url,
            })
        return Response({
            'job': {
                'id': job.id,
                'title': job.title,
                'description': job.description,
                'company': job.company,
            },
            'applicants': applicants,
        })


class ApplicationStatusView(APIView):
    permission_classes = [IsHR]

    def patch(self, request, pk):
        app = get_object_or_404(
            Application.objects.select_related('job'),
            pk=pk,
            job__created_by=request.user,
        )
        status_val = request.data.get('status')
        allowed = {c[0] for c in Application.STATUS_CHOICES}
        if status_val not in allowed:
            return Response(
                {'detail': 'Invalid status. Use applied, accepted, or rejected.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        app.status = status_val
        app.save(update_fields=['status'])
        return Response(ApplicationSerializer(app).data)
