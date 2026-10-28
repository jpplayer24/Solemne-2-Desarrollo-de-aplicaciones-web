from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from rest_framework.decorators import api_view
from .db_mongo import check_mongo_connection, setup_mongo_validators
from .serializers import ProductoSerializer

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

@api_view(['POST'])
def validar_producto_test(request):
    """Endpoint de prueba para validar que DRF exija precio > 0 y stock >= 0."""
    serializer = ProductoSerializer(data=request.data)
    if serializer.is_valid():
        return JsonResponse({"valido": True, "datos": serializer.validated_data}, status=200)
    return JsonResponse({"valido": False, "errores": serializer.errors}, status=400)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    path('api/products/validar/', validar_producto_test, name='validar_producto'),
]
