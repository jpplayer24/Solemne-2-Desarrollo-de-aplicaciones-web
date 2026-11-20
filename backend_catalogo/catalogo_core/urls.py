# backend_catalogo/catalogo_core/urls.py
from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from .db_mongo import check_mongo_connection
from .views import (
    listar_productos_paginado,
    detalle_producto,
    SincronizarCarritoView,
    ProcesarOrdenView,
    CrearProductoView
)


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
    path('api/products/', listar_productos_paginado, name='listar_productos_paginado'),
    path('api/products/<str:producto_id>/', detalle_producto, name='detalle_producto'),
    path('carrito/sincronizar/', SincronizarCarritoView.as_view(), name='sincronizar_carrito'),
    path('ordenes/crear/', ProcesarOrdenView.as_view(), name='crear_orden'),
    path('api/admin/productos/crear/', CrearProductoView.as_view(), name='crear_producto'),
]
