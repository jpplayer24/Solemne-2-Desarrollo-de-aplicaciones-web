from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from django.db import connection
from django.db.utils import OperationalError
from usuarios.views import RegistroPublicoView

def health_check(request):
    try:
        connection.ensure_connection()
        conectado = True
        mensaje = "Conexión exitosa a PostgreSQL"
        status_code = 200
    except OperationalError as e:
        conectado = False
        mensaje = f"Error de conexión a PostgreSQL: {str(e)}"
        status_code = 503

    return JsonResponse({
        "servicio": "backend_gestion",
        "postgresql": {
            "conectado": conectado,
            "mensaje": mensaje
        }
    }, status=status_code)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    path('auth/registro/', RegistroPublicoView.as_view(), name='registro-publico'),
]