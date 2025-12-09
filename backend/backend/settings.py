"""
Django settings for backend project.
"""

from pathlib import Path
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# ========== SECURITY SETTINGS ==========
# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'fallback-secret-key-for-dev-only')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

# Production Hosts
ALLOWED_HOSTS = [
    'organic.satbeta.top',
    '161.248.189.70',
    'localhost',
    '127.0.0.1',
    '*',  # সব হোস্টের জন্য
]

# ========== APPLICATION DEFINITION ==========
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party apps
    'rest_framework',
    'corsheaders',
    'django_filters',
    # Local apps
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Static files for production
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],  # যদি templates folder থাকে
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# ========== DATABASE CONFIGURATION ==========
# Production PostgreSQL database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'emarket_db'),
        'USER': os.environ.get('DB_USER', 'rezasdsju'),
        'PASSWORD': os.environ.get('DB_PASSWORD', '2313Reza@'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
        'CONN_MAX_AGE': 600,  # Connection pooling for production
        'OPTIONS': {
            'connect_timeout': 10,
            # ✅ PostgreSQL এক্সটেনশন সাপোর্টের জন্য
            'options': '-c search_path=public',
        }
    }
}

# ========== PASSWORD VALIDATION ==========
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# ========== INTERNATIONALIZATION ==========
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Dhaka'  # বাংলাদেশ সময়
USE_I18N = True
USE_L10N = True
USE_TZ = True

# ========== STATIC & MEDIA FILES ==========
# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files (User uploaded)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ========== SECURITY HEADERS ==========
if not DEBUG:
    # SSL/HTTPS settings
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    
    # Cookie security
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    
    # HSTS settings
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    # Other security settings
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_REFERRER_POLICY = 'same-origin'

# ========== CORS SETTINGS ==========
# Production CORS settings
#CORS_ALLOW_ALL_ORIGINS = False  # Production এ False রাখুন
CORS_ALLOW_ALL_ORIGINS = True  # সব origin থেকে অনুমতি দিন
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://organic.satbeta.top",
    "https://organic.satbeta.top",
    "http://161.248.189.70",
    "https://161.248.189.70",
]

CORS_ALLOW_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
]

CORS_ALLOW_HEADERS = [
    'content-type',
    'authorization',
    'x-csrftoken',
    'accept',
    'origin',
    'user-agent',
    'x-requested-with',
]

# ========== REST FRAMEWORK SETTINGS ==========
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',  # Production এ IsAuthenticated দিতে পারেন
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',  # Anonymous users
        'user': '1000/day',  # Authenticated users
        'search': '200/hour',  # ✅ নতুন: সার্চের জন্য আলাদা থ্রোটল
    },
    # ✅ সার্চ প্যারামিটার সেটিংস
    'SEARCH_PARAM': 'q',
}

# ========== LOGGING CONFIGURATION (সঠিক ও মেয়াদি) ==========
# লগ ডিরেক্টরি
LOG_DIR = os.path.join(BASE_DIR, 'logs')

# লগ ডিরেক্টরি না থাকলে তৈরি করুন
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR, mode=0o755)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'django_file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': os.path.join(LOG_DIR, 'django_error.log'),
            'formatter': 'verbose',
        },
        'app_file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(LOG_DIR, 'app.log'),
            'formatter': 'verbose',
        },
        'search_file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(LOG_DIR, 'search.log'),
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'django_file'],
            'level': 'ERROR' if not DEBUG else 'INFO',
            'propagate': True,
        },
        'api': {
            'handlers': ['console', 'app_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'api.search': {
            'handlers': ['console', 'search_file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
    # Root logger configuration
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
}

# ========== POSTGRESQL FULL-TEXT SEARCH SETTINGS ==========
# ✅ Full-text search কনফিগারেশন
POSTGRES_SEARCH_CONFIG = {
    'default_language': 'english',
    'weights': {
        'A': 1.0,   # নামের জন্য
        'B': 0.4,   # বিবরণের জন্য  
        'C': 0.2,   # ক্যাটাগরির জন্য
        'D': 0.1,   # ট্যাগের জন্য
    }
}

# ========== SEARCH SETTINGS ==========
# ✅ সার্চ সেটিংস
SEARCH_SETTINGS = {
    'MIN_SEARCH_LENGTH': 2,  # সর্বনিম্ন সার্চ লেংথ
    'MAX_RESULTS': 100,      # সর্বোচ্চ ফলাফল
    'AUTOCOMPLETE_LIMIT': 10,  # অটোকমপ্লিট লিমিট
    'FUZZY_SEARCH': True,    # ফাজি সার্চ চালু
    'USE_POSTGRES_SEARCH': True,  # PostgreSQL Full-Text Search ব্যবহার
}

# ========== GUNICORN SETTINGS ==========
# Gunicorn configuration (systemd service এর জন্য)
GUNICORN_CONFIG = {
    'workers': 3,
    'bind': '127.0.0.1:8001',
    'timeout': 120,
    'worker_class': 'sync',
}