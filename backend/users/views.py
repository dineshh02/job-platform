from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from jobs.permissions import IsCandidate
from .models import CandidateProfile
from .serializers import SignupSerializer, LoginSerializer, CandidateProfileSerializer


def _token_response(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'role': user.role,
        'email': user.email,
    }


def extract_pdf_text(file_field):
    try:
        from pypdf import PdfReader
        reader = PdfReader(file_field)
        return '\n'.join(page.extract_text() or '' for page in reader.pages)
    except Exception:
        return ''


class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(_token_response(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        return Response(_token_response(user))


class ProfileView(APIView):
    permission_classes = [IsCandidate]

    def get(self, request):
        profile, _ = CandidateProfile.objects.get_or_create(user=request.user)
        return Response(CandidateProfileSerializer(profile).data)

    def patch(self, request):
        profile, _ = CandidateProfile.objects.get_or_create(user=request.user)
        serializer = CandidateProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()

        if 'resume_file' in request.FILES:
            profile.resume_file.seek(0)
            profile.resume_text = extract_pdf_text(profile.resume_file)
            profile.save(update_fields=['resume_text'])

        return Response(CandidateProfileSerializer(profile).data)
