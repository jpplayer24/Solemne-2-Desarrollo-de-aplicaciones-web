from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from django.db import connection
from django.db.utils import DatabaseError


def health_check(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()

        return JsonResponse({
            "servicio": "backend_gestion",
            "postgresql": {
                "conectado": True,
                "base_de_datos": connection.settings_dict["NAME"],
                "mensaje": "Conexion exitosa a PostgreSQL"
            }
        }, status=200)

    except DatabaseError:
        return JsonResponse({
            "servicio": "backend_gestion",
            "postgresql": {
                "conectado": False,
                "mensaje": "Error de conexion a PostgreSQL"
            }
        }, status=503)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health_check"),
]
