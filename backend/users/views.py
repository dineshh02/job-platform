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


def parse_resume_with_gemini(text):
    import os
    import json
    from google import genai
    api_key = os.environ.get('GEMINI_API_KEY', '')
    if not api_key or not text:
        return {}
    client = genai.Client(api_key=api_key)
    prompt = (
        'Extract the following from this resume text and return ONLY valid JSON '
        'with keys: full_name (string), years_of_experience (integer), skills (comma-separated string).\n\n'
        + text[:4000]
    )
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash-lite',
            contents=prompt,
        )
        raw = response.text.strip()
        if raw.startswith('```'):
            raw = raw.split('```')[1]
            if raw.startswith('json'):
                raw = raw[4:]
        return json.loads(raw)
    except Exception:
        return {}


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

            parsed = parse_resume_with_gemini(profile.resume_text)
            if parsed:
                update_fields = []
                for field in ('full_name', 'years_of_experience', 'skills'):
                    val = parsed.get(field)
                    if val is not None:
                        setattr(profile, field, val)
                        update_fields.append(field)
                if update_fields:
                    profile.save(update_fields=update_fields)

        return Response(CandidateProfileSerializer(profile).data)
