from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from jobs.models import Application
from jobs.permissions import IsHR
from .models import CandidateProfile, HRProfile
from .serializers import (
    SignupSerializer,
    LoginSerializer,
    CandidateProfileSerializer,
    HRProfileSerializer,
)

User = get_user_model()


def _profile_is_complete(user):
    if user.role == 'hr':
        try:
            p = HRProfile.objects.get(user=user)
        except HRProfile.DoesNotExist:
            return False
        return bool((p.full_name or '').strip() and (p.company_name or '').strip())
    try:
        p = CandidateProfile.objects.get(user=user)
    except CandidateProfile.DoesNotExist:
        return False
    return bool((p.full_name or '').strip() and (p.skills or '').strip() and p.resume_file)


def _token_response(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'role': user.role,
        'email': user.email,
        'is_complete': _profile_is_complete(user),
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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == 'hr':
            profile, _ = HRProfile.objects.get_or_create(user=request.user)
            return Response(HRProfileSerializer(profile).data)
        profile, _ = CandidateProfile.objects.get_or_create(user=request.user)
        return Response(CandidateProfileSerializer(profile).data)

    def patch(self, request):
        if request.user.role == 'hr':
            profile, _ = HRProfile.objects.get_or_create(user=request.user)
            serializer = HRProfileSerializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            profile = serializer.save()
            return Response(HRProfileSerializer(profile).data)

        profile, _ = CandidateProfile.objects.get_or_create(user=request.user)
        serializer = CandidateProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()

        if 'resume_file' in request.FILES:
            from embeddings import generate_embedding
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

            if profile.resume_text:
                profile.resume_embedding = generate_embedding(profile.resume_text)
                profile.save(update_fields=['resume_embedding'])

        return Response(CandidateProfileSerializer(profile).data)


class CandidateHRDetailView(APIView):
    permission_classes = [IsHR]

    def get(self, request, user_id):
        allowed = Application.objects.filter(
            user_id=user_id,
            job__created_by=request.user,
        ).exists()
        if not allowed:
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            candidate = User.objects.get(pk=user_id, role='candidate')
        except User.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        profile, _ = CandidateProfile.objects.get_or_create(user=candidate)
        resume_url = profile.resume_file.url if profile.resume_file else None
        return Response({
            'email': candidate.email,
            'full_name': profile.full_name,
            'experience': profile.experience,
            'skills': profile.skills,
            'years_of_experience': profile.years_of_experience,
            'resume_text': profile.resume_text,
            'resume_url': resume_url,
        })
