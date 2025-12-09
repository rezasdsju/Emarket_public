from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse  # নতুন লাইন যোগ করুন

# হোমপেজের জন্য ফাংশন যোগ করুন
def home(request):
    return JsonResponse({
        'message': 'ঘরের বাজার API সার্ভার চালু আছে!',
        'endpoints': {
            'admin': '/admin/',
            'api_root': '/api/',
            'products': '/api/products/',
            'categories': '/api/categories/'
        }
    })

urlpatterns = [
    path('', home, name='home'),  # সরাসরি JSON রিটার্ন করবে
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)