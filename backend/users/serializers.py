from rest_framework import serializers
from .models import User, CandidateProfile


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

    class Meta:
        model = CandidateProfile
        fields = ['full_name', 'experience', 'skills', 'resume_file', 'resume_text', 'years_of_experience']
