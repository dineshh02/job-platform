from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Job, Application
from .serializers import JobSerializer, ApplicationSerializer
from .permissions import IsHR, IsCandidate


class JobListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        jobs = Job.objects.all().order_by('-created_at')
        return Response(JobSerializer(jobs, many=True).data)


class JobCreateView(APIView):
    permission_classes = [IsHR]

    def post(self, request):
        serializer = JobSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ApplyView(APIView):
    permission_classes = [IsCandidate]

    def post(self, request):
        serializer = ApplicationSerializer(data=request.data)
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
