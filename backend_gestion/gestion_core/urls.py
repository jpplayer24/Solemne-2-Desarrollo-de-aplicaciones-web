from django.contrib import admin
from django.urls import path, include
from django.db import connection
from django.db.utils import OperationalError
from cms_gestion import views
from django.http import JsonResponse

def home_bienvenida(request):
    return JsonResponse({
        "proyecto": "DreamHub Backend Gestión",
        "estado": "Activo",
        "endpoints_disponibles": [
            "/api/health/",
            "/api/textos/",
            "/api/textos/<seccion>/",
            "/api/tema/",
            "/api/contacto/",
            "/api/clientes/importar-csv/",
            "/api/activar-cuenta/generar/",
            "/api/carrito/sincronizar/"
        ]
    })

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
    path('', home_bienvenida, name='home_bienvenida'),
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    path('api/textos/', views.gestionar_textos, name='listar_textos'),
    path('api/textos/<str:seccion>/', views.gestionar_textos, name='gestionar_textos'),
    path('api/tema/', views.gestionar_tema_visual, name='gestionar_tema_visual'),
    path('api/contacto/', views.gestionar_mensajes_contacto, name='gestionar_mensajes_contacto'),
    path('api/clientes/importar-csv/', views.importar_clientes_csv, name='importar_clientes_csv'),
    path('api/activar-cuenta/generar/', views.generar_enlace_activacion, name='generar_enlace_activacion'),
    path('api/activar-cuenta/<uuid:token>/', views.activar_cuenta_token, name='activar_cuenta_token'),
    
    #NOTIFICACIONES PARA CORREOS 
    path('api/notificaciones/compra/',views.notificar_compra, name='notificar_compra')
    
    # Delegación de rutas hacia el microservicio del catálogo y carrito (SCRUM-48 y 49)
    #path('api/', include('catalogo_core.urls')),
]