import csv
import io
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import status
from .models import ContenidoPagina, ConfiguracionTema, MensajeContacto, ClienteImportado, TokenActivacion
from .serializers import ContenidoPaginaSerializer, ConfiguracionTemaSerializer, MensajeContactoSerializer
from .services import noti_compras


@api_view(['GET', 'PUT', 'POST'])
def gestionar_textos(request, seccion=None):
    if seccion:
        if seccion not in ['inicio', 'quienes_somos']:
            return Response({"error": "Sección inválida. Use 'inicio' o 'quienes_somos'."}, status=status.HTTP_400_BAD_REQUEST)
        
        defaults = {
            'inicio': {
                'titulo': 'Colecciones de Mochilas DreamHub',
                'subtitulo': 'Diseño técnico y urbano',
                'contenido': 'Explora nuestras mochilas de alta resistencia.',
                'materiales_ergonomia': ''
            },
            'quienes_somos': {
                'titulo': 'Quiénes Somos',
                'subtitulo': 'Materiales y Ergonomía',
                'contenido': 'Seleccionamos telas impermeables.',
                'materiales_ergonomia': 'Espaldar acolchado con flujo de aire.'
            }
        }
        obj, _ = ContenidoPagina.objects.get_or_create(seccion=seccion, defaults=defaults[seccion])

        if request.method == 'GET':
            serializer = ContenidoPaginaSerializer(obj)
            return Response(serializer.data, status=status.HTTP_200_OK)

        elif request.method in ['PUT', 'POST']:
            data = request.data.copy()
            data['seccion'] = seccion
            serializer = ContenidoPaginaSerializer(obj, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"mensaje": f"Textos de '{seccion}' actualizados.", "data": serializer.data}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'GET':
        contenidos = ContenidoPagina.objects.all()
        serializer = ContenidoPaginaSerializer(contenidos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    return Response({"error": "Especifique la sección."}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'POST'])
def gestionar_tema_visual(request):
    config, _ = ConfiguracionTema.objects.get_or_create(id=1, defaults={'tema_activo': 'tema_1'})

    if request.method == 'GET':
        serializer = ConfiguracionTemaSerializer(config)
        return Response({
            "tema_activo": serializer.data['tema_activo'],
            "temas_aprobados": ['tema_1', 'tema_2', 'tema_3', 'tema_4'],
            "updated_at": serializer.data['updated_at']
        }, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'POST']:
        serializer = ConfiguracionTemaSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "mensaje": "Tema visual actualizado exitosamente en PostgreSQL.",
                "tema_activo": serializer.data['tema_activo']
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
def gestionar_mensajes_contacto(request):
    if request.method == 'GET':
        mensajes = MensajeContacto.objects.all().order_by('-created_at')
        serializer = MensajeContactoSerializer(mensajes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = MensajeContactoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "mensaje": "Tu consulta sobre nuestras mochilas ha sido recibida y almacenada correctamente.",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({
            "error": "Error de validación en el formulario de contacto.",
            "detalles": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def importar_clientes_csv(request):
    archivo_csv = request.FILES.get('archivo')
    if not archivo_csv:
        return Response({"error": "Debes adjuntar un archivo CSV en el campo 'archivo'."}, status=status.HTTP_400_BAD_REQUEST)

    if not archivo_csv.name.endswith('.csv'):
        return Response({"error": "El archivo debe tener extensión .csv"}, status=status.HTTP_400_BAD_REQUEST)

    # Validación de codificación UTF-8
    try:
        contenido_decodificado = archivo_csv.read().decode('utf-8')
    except UnicodeDecodeError:
        return Response({"error": "El archivo no está codificado en formato UTF-8 válido."}, status=status.HTTP_400_BAD_REQUEST)

    lector = csv.DictReader(io.StringIO(contenido_decodificado))
    columnas_requeridas = {'email', 'nombre', 'apellido', 'rol'}

    if not lector.fieldnames or not columnas_requeridas.issubset(set(lector.fieldnames)):
        return Response({
            "error": f"El CSV debe contener exactamente las columnas requeridas: {list(columnas_requeridas)}",
            "columnas_encontradas": lector.fieldnames
        }, status=status.HTTP_400_BAD_REQUEST)

    filas = list(lector)
    
    # Restricción de máximo 200 filas
    if len(filas) > 200:
        return Response({
            "error": f"El archivo excede el límite máximo permitido. Contiene {len(filas)} filas y el máximo es 200."
        }, status=status.HTTP_400_BAD_REQUEST)

    procesados = []
    errores = []

    for indice, fila in enumerate(filas, start=2): # start=2 para reflejar la línea real del archivo considerando la cabecera
        email = (fila.get('email') or '').strip()
        nombre = (fila.get('nombre') or '').strip()
        apellido = (fila.get('apellido') or '').strip()
        rol = (fila.get('rol') or 'cliente').strip()
        telefono = (fila.get('telefono') or '').strip()

        # Validación por fila: si falla una, se registra en el reporte pero no aborta el resto
        if not email or not nombre or not apellido or not rol:
            errores.append({
                "fila": indice,
                "email": email or "VACÍO",
                "error": "Campos obligatorios faltantes (email, nombre, apellido o rol)."
            })
            continue

        try:
            cliente, creado = ClienteImportado.objects.update_or_create(
                email=email,
                defaults={
                    'nombre': nombre,
                    'apellido': apellido,
                    'rol': rol,
                    'telefono': telefono,
                    'estado': 'PENDIENTE_ACTIVACION'
                }
            )
            
            # Generamos su token de activación inicial
            token_obj = TokenActivacion.objects.create(cliente=cliente)
            
            procesados.append({
                "fila": indice,
                "email": cliente.email,
                "nombre": f"{cliente.nombre} {cliente.apellido}",
                "rol": cliente.rol,
                "estado": cliente.estado,
                "token_activacion": str(token_obj.token),
                "enlace_activacion": f"/api/activar-cuenta/{token_obj.token}/"
            })
        except Exception as e:
            errores.append({
                "fila": indice,
                "email": email,
                "error": f"Error al guardar en base de datos: {str(e)}"
            })

    return Response({
        "mensaje": "Procesamiento de CSV completado con reporte por fila.",
        "total_filas_leidas": len(filas),
        "total_exitosos": len(procesados),
        "total_con_errores": len(errores),
        "clientes_procesados": procesados,
        "reporte_errores": errores
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def generar_enlace_activacion(request):
    email = request.data.get('email')
    if not email:
        return Response({"error": "Debe proporcionar el 'email' del cliente."}, status=status.HTTP_400_BAD_REQUEST)

    cliente = get_object_or_404(ClienteImportado, email=email)
    
    # Creamos un nuevo token de un solo uso con 24 horas de vigencia
    token_obj = TokenActivacion.objects.create(cliente=cliente)

    return Response({
        "mensaje": "Enlace de activación de un solo uso generado con vigencia de 24 horas.",
        "email": cliente.email,
        "token": str(token_obj.token),
        "enlace_activacion": f"/api/activar-cuenta/{token_obj.token}/",
        "expires_at": token_obj.expires_at
    }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
def activar_cuenta_token(request, token):
    # Buscamos el token en la base de datos de PostgreSQL
    token_obj = get_object_or_404(TokenActivacion, token=token)

    # Validación 1: Verificar si ya fue utilizado (uso único)
    if token_obj.usado:
        return Response({
            "error": "Este enlace de activación ya fue utilizado previamente (es de un solo uso)."
        }, status=status.HTTP_400_BAD_REQUEST)

    # Validación 2: Verificar si ha expirado (más de 24 horas)
    if not token_obj.es_valido():
        return Response({
            "error": "El enlace de activación ha expirado (superó las 24 horas de vigencia)."
        }, status=status.HTTP_400_BAD_REQUEST)

    # Si pasa las validaciones, marcamos el token como usado y activamos al cliente
    token_obj.usado = True
    token_obj.save()

    cliente = token_obj.cliente
    cliente.activo = True
    cliente.estado = 'ACTIVO'
    cliente.save()

    return Response({
        "mensaje": f"Cuenta de {cliente.email} activada exitosamente.",
        "cliente_activo": True,
        "estado": cliente.estado
    }, status=status.HTTP_200_OK)
    
@api_view(['POST'])
def notificar_compra(request):
    '''
    Se encarga de recibir los datos de una compra confirmada y envia 2 correos, con toda la informacion de la compra en Dreamhu.
    Si falla el envio del correo, se registra el fallo sin revertir el fallo. 
    
    '''
    
    orden_id = request.data.get('orden_id')
    nombre_cliente = (request.data.get('nombre_cliente') or '').strip()
    email_cliente = (request.data.get('email_cliente') or '').strip()
    items = request.data.get('items', [])
    total_compra = request.data.get('total')
    
    if not orden_id or not nombre_cliente or not email_cliente or not items :
        return Response(
            {"error": "Falran datos obligatorios: 'orden_id', 'nombre_cliente', 'email_cliente', 'items "},
            status=status.HTTP_400_BAD_REQUEST
        )
    items_procesados = []
    total_calculado = 0 
    for item in items:
        nombre = item.get('nombre', 'Mochila Dreamhub')
        cantidad = int(item.get('cantidad', 1))
        precio_unitario = float(item.get('precio_unitario', 0 ))
        subtotal = cantidad * precio_unitario
        total_calculado += subtotal
        items_procesados.append({
            "nombre": nombre,
            "cantidad": cantidad,
            "precio_unitario": precio_unitario,
            "subtotal": subtotal,
        })
    total_final = total_compra if total_compra is not None else total_calculado
    
    resultado = noti_compras(
        orden_id=orden_id,
        nombre_cliente=nombre_cliente,
        email_cliente=email_cliente,
        items_mochila=items_procesados,
        total_compra=total_final,
    )
    
    return Response(
        {
            "mensaje": "Proceso de notificación ejecutado (RB-09: compra protegida ante fallos SMTP).",
            "orden_id": orden_id,
            "notificaciones": resultado,
        },
        status=status.HTTP_201_CREATED
    )