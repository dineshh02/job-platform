from rest_framework import serializers
from .models import Job, Application


class JobSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Job
        fields = ['id', 'title', 'description', 'company', 'created_by', 'created_at']
        read_only_fields = ['created_by', 'created_at']


class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['id', 'job', 'status', 'applied_at']
        read_only_fields = ['status', 'applied_at']
