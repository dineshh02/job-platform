from rest_framework import serializers
from .models import User, CandidateProfile, HRProfile


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['email', 'password', 'role']

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role'],
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        try:
            user = User.objects.get(email=data['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid credentials.')

        if not user.check_password(data['password']):
            raise serializers.ValidationError('Invalid credentials.')

        data['user'] = user
        return data


class CandidateProfileSerializer(serializers.ModelSerializer):
    resume_text = serializers.CharField(read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    is_complete = serializers.SerializerMethodField()

    class Meta:
        model = CandidateProfile
        fields = [
            'role',
            'is_complete',
            'full_name',
            'experience',
            'skills',
            'resume_file',
            'resume_text',
            'years_of_experience',
        ]

    def get_is_complete(self, obj):
        return bool(
            (obj.full_name or '').strip()
            and (obj.skills or '').strip()
            and obj.resume_file
        )


class HRProfileSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='user.role', read_only=True)
    is_complete = serializers.SerializerMethodField()

    class Meta:
        model = HRProfile
        fields = ['role', 'is_complete', 'full_name', 'company_name']

    def get_is_complete(self, obj):
        return bool((obj.full_name or '').strip() and (obj.company_name or '').strip())
