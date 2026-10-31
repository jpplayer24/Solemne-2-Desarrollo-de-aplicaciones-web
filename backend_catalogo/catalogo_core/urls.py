# backend_catalogo/catalogo_core/urls.py
from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from rest_framework.decorators import api_view
from .db_mongo import check_mongo_connection, db

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

@api_view(['GET'])
def listar_productos(request):
    """Endpoint para obtener los productos persistidos remotamente en MongoDB."""
    try:
        coleccion = db["productos"]
        productos = list(coleccion.find({}, {"_id": 0})) # Excluir _id no serializable
        return JsonResponse({"status": "success", "data": productos}, status=200)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    path('api/products/', listar_productos, name='listar_productos'),
]