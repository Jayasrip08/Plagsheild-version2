import re

from django.conf import settings
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User

class UserSerializer(serializers.ModelSerializer):
    college_name = serializers.CharField(source='college.college_name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'phone',
            'college',
            'college_name',
            'department',
            'is_active',
        ]


class RegisterSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default='b2c_student')
    college_id = serializers.IntegerField(required=False, write_only=True)
    admin_secret = serializers.CharField(required=False, write_only=True, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'phone', 'role', 'first_name', 'last_name', 'college_id', 'admin_secret', 'department']
        extra_kwargs = {'password': {'write_only': True}}

    def validate_college_id(self, value):
        from colleges.models import College
        try:
            College.objects.get(id=value)
        except College.DoesNotExist:
            raise serializers.ValidationError('College does not exist.')
        return value

    PASSWORD_PATTERN = re.compile(r'^(?=.{8}$)(?=.*[!@#$%^&*()_+\-=[\]{};\'":\\|,.<>/?])[A-Z][A-Za-z0-9!@#$%^&*()_+\-=[\]{};\'":\\|,.<>/?]{7}$')

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('This email is already registered. One email can only be used for a single role.')
        return value

    def validate_phone(self, value):
        if value and not re.match(r'^(?:\+91)?\d{10}$', value):
            raise serializers.ValidationError('Phone number must be 10 digits and may include the +91 prefix.')
        return value

    def validate_password(self, value):
        if not self.PASSWORD_PATTERN.match(value):
            raise serializers.ValidationError('Password must be exactly 8 characters, start with an uppercase letter, and include at least one special character.')
        return value

    def validate(self, attrs):
        if attrs.get('role') == 'super_admin':
            expected_secret = getattr(settings, 'SUPER_ADMIN_SECRET', 'super_admin_secret_key_123')
            if attrs.get('admin_secret') != expected_secret:
                raise serializers.ValidationError({'admin_secret': 'Invalid admin secret. Use the configured SUPER_ADMIN_SECRET value.'})
        return attrs

    def create(self, validated_data):
        role = validated_data.pop('role', 'b2c_student')
        admin_secret = validated_data.pop('admin_secret', None)
        college_id = validated_data.pop('college_id', None)
        department = validated_data.pop('department', '')
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')

        username = validated_data.get('username') or validated_data.get('email')
        if not username:
            raise serializers.ValidationError({'username': 'Username or email is required.'})

        college = None
        if college_id:
            from colleges.models import College
            college = College.objects.get(id=college_id)

        user = User.objects.create_user(
            username=username,
            email=validated_data['email'],
            password=validated_data['password'],
            phone=validated_data.get('phone', ''),
            first_name=first_name,
            last_name=last_name,
            role=role,
            college=college,
            department=department,
        )

        try:
            from services.firestore_service import save_user_to_firestore
            save_user_to_firestore(user)
        except Exception as e:
            print(f"Firestore User Sync Error: {e}")

        return user


class B2BStudentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'department']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        college = self.context['request'].user.college
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            department=validated_data.get('department', ''),
            college=college,
            role='b2b_student'
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = getattr(user, 'role', 'b2c_student')
        token['college_id'] = user.college.id if getattr(user, 'college', None) else None
        token['college_name'] = user.college.college_name if getattr(user, 'college', None) else None
        token['department'] = getattr(user, 'department', '')
        return token

    def validate(self, attrs):
        username_or_email = attrs.get('username', '').strip()
        password = attrs.get('password', '')

        # 1. First attempt standard Django authentication
        if username_or_email:
            from django.db.models import Q
            db_user = User.objects.filter(Q(email__iexact=username_or_email) | Q(username__iexact=username_or_email)).first()
            if db_user:
                attrs['username'] = db_user.username

        try:
            data = super().validate(attrs)
            data['user'] = {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'role': self.user.role,
                'phone': self.user.phone,
                'college_id': self.user.college.id if self.user.college else None,
                'college_name': self.user.college.college_name if self.user.college else None,
                'department': self.user.department
            }
            return data
        except Exception:
            pass

        # 2. Fallback authentication directly against Firestore
        try:
            from services.firestore_service import verify_firestore_user_password
            fs_user, error_msg = verify_firestore_user_password(username_or_email, password)
            if fs_user and not error_msg:
                # Synchronize/Create local Django User instance for SimpleJWT token generation
                user_obj, created = User.objects.get_or_create(
                    username=fs_user['username'],
                    defaults={
                        'email': fs_user.get('email', ''),
                        'role': fs_user.get('role', 'b2c_student'),
                        'first_name': fs_user.get('first_name', ''),
                        'last_name': fs_user.get('last_name', ''),
                        'phone': fs_user.get('phone', ''),
                        'department': fs_user.get('department', ''),
                        'is_active': fs_user.get('is_active', True),
                    }
                )
                user_obj.set_password(password)
                user_obj.role = fs_user.get('role', 'b2c_student')
                user_obj.is_active = fs_user.get('is_active', True)
                if user_obj.role == 'super_admin':
                    user_obj.is_superuser = True
                    user_obj.is_staff = True
                user_obj.save()

                attrs['username'] = user_obj.username
                self.user = user_obj
                data = super().validate(attrs)
                data['user'] = {
                    'id': user_obj.id,
                    'username': user_obj.username,
                    'email': user_obj.email,
                    'role': user_obj.role,
                    'phone': user_obj.phone,
                    'college_id': user_obj.college.id if user_obj.college else None,
                    'college_name': user_obj.college.college_name if user_obj.college else None,
                    'department': user_obj.department
                }
                return data
        except Exception as e:
            print(f"Firestore Auth Fallback Error: {e}")

        raise serializers.ValidationError({"detail": "No active account found with the given credentials"})