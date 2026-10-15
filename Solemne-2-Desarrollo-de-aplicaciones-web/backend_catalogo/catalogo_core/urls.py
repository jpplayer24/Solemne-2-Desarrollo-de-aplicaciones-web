from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from .db_mongo import check_mongo_connection

def health_check(request):
    conectado, mensaje = check_mongo_connection()
    status_code = 200 if conectado else 503
    return JsonResponse({
        "servicio": "backend_catalogo",
        "mongodb": {
            "conectado": conectado,
            "mensaje": mensaje
        }
    }, status=status_code)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
]