# backend_catalogo/catalogo_core/views.py
from bson.objectid import ObjectId
from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import JsonResponse
from django.utils.crypto import get_random_string
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from .db_mongo import db, get_productos_collection
from .models import EstadoOrden, ItemOrden, OrdenDeCompra
from .reconciliation import ErrorConciliacion, conciliar_pago_orden
from .serializers import ItemCarritoSerializer, ProductoSerializer


def _obtener_stock_disponible(producto):
    stock_total = (
        producto.get("stock_fisico", 0)
        if "stock_fisico" in producto
        else producto.get("stock_inicial", 0)
    )
    return stock_total - producto.get("stock_reservado", 0)


@api_view(['GET'])
def listar_productos_paginado(request):
    try:
        coleccion = get_productos_collection()

        try:
            pagina = int(request.GET.get('page', 1))
            limite = int(request.GET.get('limit', 10))
        except ValueError:
            pagina = 1
            limite = 10

        # RNF-03: Limitar estrictamente a un máximo de 50 mochilas por consulta
        if limite > 50:
            limite = 50
        if limite < 1:
            limite = 10
        if pagina < 1:
            pagina = 1

        skip = (pagina - 1) * limite

        filtro = {"estado_activo": True}

        total_productos = coleccion.count_documents(filtro)
        cursor = coleccion.find(filtro, {"_id": 0}).skip(skip).limit(limite)
        productos = list(cursor)

        for producto in productos:
            stock_disponible = _obtener_stock_disponible(producto)
            producto["stock_disponible"] = max(0, stock_disponible)
            producto["disponible"] = stock_disponible > 0

        total_paginas = (total_productos + limite - 1) // limite

        return JsonResponse(
            {
                "status": "success",
                "paginacion": {
                    "total_registros": total_productos,
                    "total_paginas": total_paginas,
                    "pagina_actual": pagina,
                    "por_pagina": limite,
                },
                "data": productos,
            },
            status=200,
        )

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(['GET'])
def detalle_producto(request, producto_id):
    try:
        coleccion = get_productos_collection()

        producto = None
        if ObjectId.is_valid(producto_id):
            producto = coleccion.find_one({
                "_id": ObjectId(producto_id),
                "estado_activo": True
            })

        if not producto:
            producto = coleccion.find_one({
                "sku": producto_id,
                "estado_activo": True
            })

        if not producto:
            return JsonResponse({"status": "error", "message": "Mochila no encontrada."}, status=404)

        stock_disponible = _obtener_stock_disponible(producto)
        producto["stock_disponible"] = max(0, stock_disponible)
        producto["disponible"] = stock_disponible > 0

        if "_id" in producto:
            producto["id"] = str(producto.pop("_id"))

        return JsonResponse({"status": "success", "data": producto}, status=200)

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


class SincronizarCarritoView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ItemCarritoSerializer(data=request.data, many=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        items_entrantes = serializer.validated_data
        coleccion_productos = get_productos_collection()
        coleccion_carritos = db["carritos"]

        usuario_id = str(request.user.id) if request.user.is_authenticated else None
        carrito_matematico = {}

        if usuario_id:
            carrito_db = coleccion_carritos.find_one({"usuario_id": usuario_id})
            if carrito_db:
                for item in carrito_db.get("items", []):
                    carrito_matematico[item["sku"]] = item["cantidad"]

        for item in items_entrantes:
            sku = item["sku"]
            cantidad = item["cantidad"]
            if sku in carrito_matematico:
                carrito_matematico[sku] += cantidad
            else:
                carrito_matematico[sku] = cantidad

        total_dinero = 0
        detalle_boleta = []
        items_finales_para_guardar = []

        for sku, cantidad in carrito_matematico.items():
            producto = coleccion_productos.find_one({"sku": sku})
            if not producto or _obtener_stock_disponible(producto) < cantidad:
                continue

            precio_real = producto["precio"]
            subtotal = precio_real * cantidad
            total_dinero += subtotal

            detalle_boleta.append({
                "sku": sku,
                "nombre": producto.get("nombre", "Sin nombre"),
                "cantidad": cantidad,
                "precio_unitario": precio_real,
                "subtotal": subtotal,
            })

            items_finales_para_guardar.append({"sku": sku, "cantidad": cantidad})

        if usuario_id:
            coleccion_carritos.update_one(
                {"usuario_id": usuario_id},
                {"$set": {"items": items_finales_para_guardar}},
                upsert=True,
            )

        return Response(
            {"detalle": detalle_boleta, "total_carrito": total_dinero},
            status=status.HTTP_200_OK,
        )


class ProcesarOrdenView(APIView):
    def post(self, request):
        items = request.data.get('items', [])
        if not isinstance(items, list) or not items:
            return Response({"error": "El carrito está vacío"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ItemCarritoSerializer(data=items, many=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        coleccion = get_productos_collection()
        total_orden = 0
        items_a_guardar = []

        for item in serializer.validated_data:
            sku = item['sku']
            cantidad = item['cantidad']

            producto = coleccion.find_one({"sku": sku})
            if not producto or _obtener_stock_disponible(producto) < cantidad:
                return Response(
                    {"error": f"Error de stock o SKU para {sku}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            precio_real = producto["precio"]
            subtotal = precio_real * cantidad
            total_orden += subtotal

            items_a_guardar.append({
                "sku": sku,
                "cantidad": cantidad,
                "precio": precio_real,
                "subtotal": subtotal,
            })

        try:
            with transaction.atomic():
                nueva_orden = OrdenDeCompra.objects.create(
                    usuario_id=str(request.user.id) if request.user.is_authenticated else "Invitado",
                    total_pagado=total_orden,
                    estado=EstadoOrden.PENDIENTE_PAGO,
                )

                for i in items_a_guardar:
                    ItemOrden.objects.create(
                        orden=nueva_orden,
                        sku=i["sku"],
                        cantidad=i["cantidad"],
                        precio_unitario_fijo=i["precio"],
                        subtotal=i["subtotal"],
                    )
        except Exception:
            return Response(
                {"error": "Fallo en la persistencia transaccional"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "mensaje": "Orden procesada y congelada exitosamente",
                "orden_id": str(nueva_orden.id),
                "estado": nueva_orden.estado,
                "expira_en": nueva_orden.fecha_expiracion_reserva.isoformat(),
                "total": total_orden,
            },
            status=status.HTTP_201_CREATED,
        )


class TransicionarEstadoOrdenView(APIView):
    """SCRUM-61: Ejecuta transiciones controladas sobre la máquina de estados de una orden."""

    def post(self, request, orden_id):
        nuevo_estado = request.data.get("estado")
        motivo = request.data.get("motivo", "")

        if not nuevo_estado:
            return Response(
                {"error": "El campo 'estado' es obligatorio."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            try:
                orden = OrdenDeCompra.objects.select_for_update().get(id=orden_id)
            except OrdenDeCompra.DoesNotExist:
                return Response(
                    {"error": f"Orden '{orden_id}' no encontrada."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            estado_anterior = orden.estado
            try:
                orden.transicionar_estado(nuevo_estado, motivo=motivo)
            except ValidationError as exc:
                return Response(
                    {"error": exc.messages[0]},
                    status=status.HTTP_409_CONFLICT,
                )

        return Response(
            {
                "orden_id": str(orden.id),
                "estado_anterior": estado_anterior,
                "estado_actual": orden.estado,
                "motivo": orden.motivo_estado,
            },
            status=status.HTTP_200_OK,
        )


class ConciliarPagoOrdenView(APIView):
    """SCRUM-64: Concilia pagos confirmados/tardíos y deriva a REVISION_REQUERIDA sin stock negativo."""

    def post(self, request, orden_id):
        monto_pagado = request.data.get("monto_pagado")
        pago_referencia = request.data.get("pago_referencia")
        pago_aprobado = request.data.get("pago_aprobado", True)

        if not isinstance(monto_pagado, int) or isinstance(monto_pagado, bool) or monto_pagado <= 0:
            return Response(
                {"error": "El campo 'monto_pagado' debe ser un entero positivo en CLP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not pago_referencia or not isinstance(pago_referencia, str):
            return Response(
                {"error": "El campo 'pago_referencia' es obligatorio."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(pago_aprobado, bool):
            return Response(
                {"error": "El campo 'pago_aprobado' debe ser booleano."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            resultado = conciliar_pago_orden(
                orden_id=orden_id,
                monto_pagado=monto_pagado,
                pago_referencia=pago_referencia,
                pago_aprobado=pago_aprobado,
            )
            return Response(resultado, status=status.HTTP_200_OK)
        except ErrorConciliacion as exc:
            return Response({"error": exc.mensaje}, status=exc.status_code)


class ListarOrdenesRevisionView(APIView):
    """Lista las órdenes en REVISION_REQUERIDA para el panel administrativo de conciliación."""

    def get(self, request):
        ordenes = (
            OrdenDeCompra.objects.filter(estado=EstadoOrden.REVISION_REQUERIDA)
            .prefetch_related('items')
            .order_by('-fecha_actualizacion')
        )
        data = [
            {
                "orden_id": str(orden.id),
                "usuario_id": orden.usuario_id,
                "total_pagado": orden.total_pagado,
                "pago_referencia": orden.pago_referencia,
                "pago_confirmado_externo": orden.pago_confirmado_externo,
                "motivo_estado": orden.motivo_estado,
                "fecha_creacion": orden.fecha_creacion.isoformat(),
                "items": [
                    {
                        "sku": item.sku,
                        "cantidad": item.cantidad,
                        "precio_unitario_fijo": item.precio_unitario_fijo,
                        "subtotal": item.subtotal,
                    }
                    for item in orden.items.all()
                ],
            }
            for orden in ordenes
        ]
        return Response({"total": len(data), "ordenes": data}, status=status.HTTP_200_OK)


class CrearProductoView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        datos = request.data.copy()

        # Generar SKU si no viene informado
        sku = datos.get("sku")
        if not isinstance(sku, str) or not sku.strip():
            datos["sku"] = get_random_string(length=10).upper()

        if not datos.get("categoria_id"):
            datos["categoria_id"] = "GENERAL"

        coleccion = get_productos_collection()

        # Validar mediante el serializador DRF
        serializer = ProductoSerializer(data=datos)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        datos_validados = serializer.validated_data
        sku = datos_validados["sku"]

        # Comprobar SKU duplicado
        if coleccion.find_one({"sku": sku}):
            return Response(
                {"error": "Ya existe un producto con este identificador (SKU)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        nuevo_producto = {
            **datos_validados,
            "stock_reservado": 0,
        }

        try:
            coleccion.insert_one(nuevo_producto)
            nuevo_producto.pop("_id", None)

            return Response(
                {
                    "mensaje": "Producto creado exitosamente",
                    "producto": nuevo_producto,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response(
                {"error": f"Fallo al guardar en MongoDB: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )