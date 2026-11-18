# backend_catalogo/catalogo_core/views.py
from django.db import transaction
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny
from bson.objectid import ObjectId

from .serializers import ItemCarritoSerializer, ProductoSerializer
from .db_mongo import get_productos_collection, db, check_mongo_connection
from .models import OrdenDeCompra, ItemOrden


@api_view(['GET'])
def listar_productos_paginado(request):

    try:
        coleccion = get_productos_collection()

        # Parámetros de paginación desde la petición
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

        # Filtro: Productos donde estado_activo sea verdadero
        filtro = {
            "$or": [
                {"estado_activo": True},
                {"activo": True},
                {"status": "published"}
            ]
        }

        total_productos = coleccion.count_documents(filtro)
        cursor = coleccion.find(filtro, {"_id": 0}).skip(skip).limit(limite)
        productos = list(cursor)

        total_paginas = (total_productos + limite - 1) // limite

        return JsonResponse({
            "status": "success",
            "paginacion": {
                "total_registros": total_productos,
                "total_paginas": total_paginas,
                "pagina_actual": pagina,
                "por_pagina": limite
            },
            "data": productos
        }, status=200)

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@api_view(['GET'])
def detalle_producto(request, producto_id):
    try:
        coleccion = get_productos_collection()

        # Buscar por ObjectId o por campo inmutable SKU
        producto = None
        if ObjectId.is_valid(producto_id):
            producto = coleccion.find_one({"_id": ObjectId(producto_id)})
        
        if not producto:
            producto = coleccion.find_one({"sku": producto_id})

        if not producto:
            return JsonResponse({"status": "error", "message": "Mochila no encontrada."}, status=404)

        if "_id" in producto:
            producto["id"] = str(producto.pop("_id"))

        return JsonResponse({
            "status": "success",
            "data": producto
        }, status=200)

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


class SincronizarCarritoView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # 1. Validar entrada (array de items con "sku" y "cantidad")
        serializer = ItemCarritoSerializer(data=request.data, many=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        items_entrantes = serializer.validated_data
        coleccion_productos = get_productos_collection()
        coleccion_carritos = db["carritos"]
        
        usuario_id = str(request.user.id) if request.user.is_authenticated else None
        carrito_matematico = {}

        # 2. SCRUM-49: Si hay usuario autenticado, recuperar carrito de MongoDB Atlas
        if usuario_id:
            carrito_db = coleccion_carritos.find_one({"usuario_id": usuario_id})
            if carrito_db:
                for item in carrito_db.get("items", []):
                    carrito_matematico[item["sku"]] = item["cantidad"]

        # 3. SCRUM-49: Fusionar (sumar) el carrito local entrante con el persistido
        for item in items_entrantes:
            sku = item["sku"]
            cantidad = item["cantidad"]
            if sku in carrito_matematico:
                carrito_matematico[sku] += cantidad
            else:
                carrito_matematico[sku] = cantidad

        # 4. SCRUM-48: Calcular valores usando la fuente de verdad en MongoDB
        total_dinero = 0
        detalle_boleta = []
        items_finales_para_guardar = []

        for sku, cantidad in carrito_matematico.items():
            producto = coleccion_productos.find_one({"sku": sku})
            
            # Verificar existencia y stock disponible contra el inventario
            if not producto or producto.get("stock_inicial", 0) < cantidad:
                continue 
            
            precio_real = producto["precio"]
            subtotal = precio_real * cantidad
            total_dinero += subtotal
            
            detalle_boleta.append({
                "sku": sku,
                "nombre": producto.get("nombre", "Sin nombre"),
                "cantidad": cantidad,
                "precio_unitario": precio_real,
                "subtotal": subtotal
            })
            
            items_finales_para_guardar.append({"sku": sku, "cantidad": cantidad})

        # 5. Persistir el carrito en MongoDB si el usuario está autenticado
        if usuario_id:
            coleccion_carritos.update_one(
                {"usuario_id": usuario_id},
                {"$set": {"items": items_finales_para_guardar}},
                upsert=True
            )

        return Response({
            "detalle": detalle_boleta,
            "total_carrito": total_dinero
        }, status=status.HTTP_200_OK)


class ProcesarOrdenView(APIView):
    def post(self, request):
        items = request.data.get('items', [])
        if not items:
            return Response({"error": "El carrito está vacío"}, status=status.HTTP_400_BAD_REQUEST)

        coleccion = get_productos_collection()
        total_orden = 0
        items_a_guardar = []

        # 1. Recálculo estricto en el servidor
        for item in items:
            sku = item.get('sku')
            cantidad = item.get('cantidad', 1)
            
            producto = coleccion.find_one({"sku": sku})
            if not producto or producto.get("stock_inicial", 0) < cantidad:
                return Response({"error": f"Error de stock o SKU para {sku}"}, status=status.HTTP_400_BAD_REQUEST)
            
            precio_real = producto["precio"]
            subtotal = precio_real * cantidad
            total_orden += subtotal
            
            items_a_guardar.append({
                "sku": sku,
                "cantidad": cantidad,
                "precio": precio_real,
                "subtotal": subtotal
            })

        # 2. Guardado transaccional en PostgreSQL
        try:
            with transaction.atomic():
                nueva_orden = OrdenDeCompra.objects.create(
                    usuario_id=str(request.user.id) if request.user.is_authenticated else "Invitado",
                    total_pagado=total_orden
                )
                
                for i in items_a_guardar:
                    ItemOrden.objects.create(
                        orden=nueva_orden,
                        sku=i["sku"],
                        cantidad=i["cantidad"],
                        precio_unitario_fijo=i["precio"],
                        subtotal=i["subtotal"]
                    )
        except Exception as e:
            return Response({"error": f"Fallo en la persistencia transaccional: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "mensaje": "Orden procesada y congelada exitosamente",
            "orden_id": nueva_orden.id,
            "total": total_orden
        }, status=status.HTTP_201_CREATED)

class CrearProductoView(APIView):
        # Para pruebas usar AllowAny en vez de isAdminUser.
    permission_classes = [isAdminUser] 

    def post(self, request):
        datos = request.data
        coleccion = get_productos_collection()

        try:
            precio = int(datos.get("precio", 0))
            stock_fisico = int(datos.get("stock_inicial", -1))
        except ValueError:
            return Response({"error": "Precio y stock deben ser números enteros."}, status=status.HTTP_400_BAD_REQUEST)

        if precio <= 0 or stock_fisico < 0:
            return Response({"error": "Precio debe ser > 0 y stock físico >= 0."}, status=status.HTTP_400_BAD_REQUEST)

        if not datos.get("nombre", "").strip() or not datos.get("descripcion", "").strip():
            return Response({"error": "Nombre y descripción no pueden estar vacíos."}, status=status.HTTP_400_BAD_REQUEST)

        imagenes = datos.get("imagenes", [])
        if not isinstance(imagenes, list) or len(imagenes) < 4 or len(imagenes) > 6:
            return Response({"error": "El producto debe tener entre 4 y 6 imágenes válidas."}, status=status.HTTP_400_BAD_REQUEST)

        sku = datos.get("sku", get_random_string(length=10).upper())

        if coleccion.find_one({"sku": sku}):
            return Response({"error": "Ya existe un producto con este identificador (SKU)."}, status=status.HTTP_400_BAD_REQUEST)

      
        nuevo_producto = {
            "sku": sku,
            "nombre": datos.get("nombre").strip(),
            "descripcion": datos.get("descripcion").strip(),
            "categoria_id": datos.get("categoria_id", "GENERAL"),
            "precio": precio,
            "stock_inicial": stock_fisico,  
            "stock_reservado": 0,           
            "moneda": datos.get("moneda", "CLP"),
            "imagenes": imagenes,
            "estado_activo": datos.get("estado_activo", True)
        }

        try:
            coleccion.insert_one(nuevo_producto)
            nuevo_producto.pop("_id", None)
            return Response({
                "mensaje": "Producto creado exitosamente",
                "producto": nuevo_producto
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": f"Fallo al guardar en MongoDB: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
