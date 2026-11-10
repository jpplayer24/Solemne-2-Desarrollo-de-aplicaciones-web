from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .serializers import ItemCarritoSerializer
from .db_mongo import get_productos_collection, db

class SincronizarCarritoView(APIView):
    # Permite acceso a invitados y usuarios logueados
    permission_classes = [AllowAny]

    def post(self, request):
        # 1. Validar que el frontend solo envíe un array de objetos con "sku" y "cantidad"
        serializer = ItemCarritoSerializer(data=request.data, many=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        items_entrantes = serializer.validated_data
        coleccion_productos = get_productos_collection()
        coleccion_carritos = db["carritos"] # Nueva colección para persistir el carro
        
        # Detectar si el usuario mandó token de sesión
        usuario_id = str(request.user.id) if request.user.is_authenticated else None
        carrito_matematico = {}

        # 2. SCRUM-49: Si hay sesión, extraer el carro guardado de días anteriores
        if usuario_id:
            carrito_db = coleccion_carritos.find_one({"usuario_id": usuario_id})
            if carrito_db:
                for item in carrito_db.get("items", []):
                    carrito_matematico[item["sku"]] = item["cantidad"]

        # 3. SCRUM-49: Fusionar (sumar) el carro local con el carro guardado
        for item in items_entrantes:
            sku = item["sku"]
            cantidad = item["cantidad"]
            if sku in carrito_matematico:
                carrito_matematico[sku] += cantidad
            else:
                carrito_matematico[sku] = cantidad

        # 4. SCRUM-48: Calcular precios reales contra MongoDB
        total_dinero = 0
        detalle_boleta = []
        items_finales_para_guardar = []

        for sku, cantidad in carrito_matematico.items():
            # Leer la fuente de verdad inmutable
            producto = coleccion_productos.find_one({"sku": sku})
            
            # Descartar si el producto fue borrado o no hay stock de la suma total
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

        # 5. Guardar la fusión en MongoDB solo si el usuario está autenticado
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
from django.db import transaction
from .models import OrdenDeCompra, ItemOrden

class ProcesarOrdenView(APIView):
    def post(self, request):
        items = request.data.get('items', [])
        if not items:
            return Response({"error": "El carrito está vacío"}, status=status.HTTP_400_BAD_REQUEST)

        coleccion = get_productos_collection()
        total_orden = 0
        items_a_guardar = []

        # 1. Recálculo estricto contra MongoDB (Seguridad CC-06)
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

        # 2. El Snapshot: Congelar los datos en PostgreSQL
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
            return Response({"error": "Fallo en la persistencia transaccional"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "mensaje": "Orden procesada y congelada exitosamente",
            "orden_id": nueva_orden.id,
            "total": total_orden
        }, status=status.HTTP_201_CREATED)    