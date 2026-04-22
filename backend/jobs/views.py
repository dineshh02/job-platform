from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Job, Application
from .serializers import JobSerializer, ApplicationSerializer
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
        serializer = JobSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job = serializer.save(created_by=request.user)
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
