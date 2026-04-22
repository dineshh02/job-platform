from rest_framework import serializers
from .models import Job, Application


class JobSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    match_score = serializers.IntegerField(read_only=True, allow_null=True, default=None)

    class Meta:
        model = Job
        fields = ['id', 'title', 'description', 'company', 'created_by', 'created_at', 'match_score']
        read_only_fields = ['created_by', 'created_at', 'match_score']


class ApplicationSerializer(serializers.ModelSerializer):
    candidate_email = serializers.EmailField(source='user.email', read_only=True)
    candidate_name = serializers.CharField(source='user.get_full_name', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)

    class Meta:
        model = Application
        fields = ['id', 'job', 'job_title', 'status', 'applied_at', 'candidate_email', 'candidate_name']
        read_only_fields = ['status', 'applied_at', 'candidate_email', 'candidate_name', 'job_title']

    def validate(self, data):
        user = self.context.get('request').user
        if Application.objects.filter(user=user, job=data['job']).exists():
            raise serializers.ValidationError('You have already applied for this job.')
        return data
