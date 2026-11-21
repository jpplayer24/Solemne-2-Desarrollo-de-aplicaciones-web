from django.db import transaction
from pymongo.errors import PyMongoError
from .db_mongo import client, get_productos_collection
from .models import EstadoOrden, OrdenDeCompra


class ErrorConciliacion(Exception):
    def __init__(self, mensaje, status_code=400):
        super().__init__(mensaje)
        self.mensaje = mensaje
        self.status_code = status_code


class StockInsuficienteError(Exception):
    pass


def _descontar_stock_atomico_mongo(items_orden, es_pago_tardio):
    """
    Ejecuta descuento indivisible en MongoDB Atlas.
    Si un SKU carece de stock disponible, aborta la transacción completa sin generar negativos.
    Retorna la lista de descuentos aplicados para compensación en caso de fallo en PostgreSQL.
    """
    coleccion = get_productos_collection()
    aplicados = []

    with client.start_session() as session:
        with session.start_transaction():
            for item in items_orden:
                doc = coleccion.find_one({"sku": item.sku}, session=session)
                if not doc:
                    raise StockInsuficienteError(f"SKU '{item.sku}' inexistente en catálogo.")

                usa_esquema_reservas = "stock_fisico" in doc

                if usa_esquema_reservas:
                    reservado = doc.get("stock_reservado", 0)
                    if not es_pago_tardio and reservado >= item.cantidad:
                        filtro = {
                            "sku": item.sku,
                            "stock_fisico": {"$gte": item.cantidad},
                            "stock_reservado": {"$gte": item.cantidad},
                        }
                        actualizacion = {
                            "$inc": {
                                "stock_fisico": -item.cantidad,
                                "stock_reservado": -item.cantidad,
                            }
                        }
                        reverso = {
                            "$inc": {
                                "stock_fisico": item.cantidad,
                                "stock_reservado": item.cantidad,
                            }
                        }
                    else:
                        # En pagos tardíos la reserva expiró; solo se puede tomar stock libre no reservado
                        filtro = {
                            "sku": item.sku,
                            "$expr": {
                                "$gte": [
                                    {"$subtract": ["$stock_fisico", {"$ifNull": ["$stock_reservado", 0]}]},
                                    item.cantidad,
                                ]
                            },
                        }
                        actualizacion = {"$inc": {"stock_fisico": -item.cantidad}}
                        reverso = {"$inc": {"stock_fisico": item.cantidad}}
                else:
                    filtro = {
                        "sku": item.sku,
                        "stock_inicial": {"$gte": item.cantidad},
                    }
                    actualizacion = {"$inc": {"stock_inicial": -item.cantidad}}
                    reverso = {"$inc": {"stock_inicial": item.cantidad}}

                resultado = coleccion.update_one(filtro, actualizacion, session=session)
                if resultado.modified_count != 1:
                    raise StockInsuficienteError(
                        f"Stock insuficiente para SKU '{item.sku}' (solicitado: {item.cantidad})."
                    )

                aplicados.append((item.sku, reverso))

    return aplicados


def _revertir_descuento_mongo(aplicados):
    if not aplicados:
        return
    coleccion = get_productos_collection()
    for sku, reverso in aplicados:
        coleccion.update_one({"sku": sku}, reverso)


def conciliar_pago_orden(orden_id, monto_pagado, pago_referencia, pago_aprobado=True):
    """
    Orquesta la confirmación de pago, expiración de reservas y compensación por pago tardío (RF-38).
    """
    descuentos_aplicados = []

    try:
        with transaction.atomic():
            try:
                orden = (
                    OrdenDeCompra.objects.select_for_update()
                    .prefetch_related('items')
                    .get(id=orden_id)
                )
            except OrdenDeCompra.DoesNotExist:
                raise ErrorConciliacion(f"Orden '{orden_id}' no encontrada.", status_code=404)

            # Idempotencia: reintentos de webhook sobre orden ya consolidada no re-descuentan stock
            if orden.estado == EstadoOrden.CONFIRMADA:
                return {
                    "orden_id": str(orden.id),
                    "estado": orden.estado,
                    "idempotente": True,
                    "mensaje": "La orden ya fue confirmada previamente.",
                }

            if orden.estado in (EstadoOrden.CANCELADA, EstadoOrden.RECHAZADA):
                raise ErrorConciliacion(
                    f"La orden está en estado terminal '{orden.estado}' y no admite confirmación.",
                    status_code=409,
                )

            if not pago_aprobado:
                orden.pago_referencia = pago_referencia
                orden.transicionar_estado(
                    EstadoOrden.RECHAZADA,
                    motivo=f"Pago rechazado por pasarela (ref: {pago_referencia}).",
                    guardar=False,
                )
                orden.save(
                    update_fields=['estado', 'pago_referencia', 'motivo_estado', 'fecha_actualizacion']
                )
                return {
                    "orden_id": str(orden.id),
                    "estado": orden.estado,
                    "idempotente": False,
                    "mensaje": "Pago rechazado registrado.",
                }

            if monto_pagado != orden.total_pagado:
                orden.pago_referencia = pago_referencia
                orden.pago_confirmado_externo = True
                orden.transicionar_estado(
                    EstadoOrden.REVISION_REQUERIDA,
                    motivo=(
                        f"Discrepancia de monto: pasarela informó {monto_pagado} CLP, "
                        f"snapshot exige {orden.total_pagado} CLP."
                    ),
                    guardar=False,
                )
                orden.save(
                    update_fields=[
                        'estado',
                        'pago_referencia',
                        'pago_confirmado_externo',
                        'motivo_estado',
                        'fecha_actualizacion',
                    ]
                )
                return {
                    "orden_id": str(orden.id),
                    "estado": orden.estado,
                    "idempotente": False,
                    "mensaje": orden.motivo_estado,
                }

            es_pago_tardio = orden.reserva_expirada
            if es_pago_tardio and orden.estado != EstadoOrden.VENCIDA:
                orden.transicionar_estado(
                    EstadoOrden.VENCIDA,
                    motivo="Reserva expirada (>15 min) antes de la confirmación de pago.",
                    guardar=False,
                )

            items_orden = list(orden.items.all())
            orden.pago_confirmado_externo = True
            orden.pago_referencia = pago_referencia

            try:
                descuentos_aplicados = _descontar_stock_atomico_mongo(items_orden, es_pago_tardio)
            except StockInsuficienteError as err:
                # RF-38: Pago aprobado pero reserva vencida y sin stock -> REVISION_REQUERIDA sin stock negativo
                orden.transicionar_estado(
                    EstadoOrden.REVISION_REQUERIDA,
                    motivo=f"Pago tardío aprobado sin stock disponible ({err}). Requiere compensación/reembolso.",
                    guardar=False,
                )
                orden.save(
                    update_fields=[
                        'estado',
                        'pago_confirmado_externo',
                        'pago_referencia',
                        'motivo_estado',
                        'fecha_actualizacion',
                    ]
                )
                return {
                    "orden_id": str(orden.id),
                    "estado": orden.estado,
                    "idempotente": False,
                    "mensaje": orden.motivo_estado,
                }
            except PyMongoError as err:
                orden.transicionar_estado(
                    EstadoOrden.REVISION_REQUERIDA,
                    motivo=f"Pago aprobado pero fallo de conexión/transacción en MongoDB: {err}",
                    guardar=False,
                )
                orden.save(
                    update_fields=[
                        'estado',
                        'pago_confirmado_externo',
                        'pago_referencia',
                        'motivo_estado',
                        'fecha_actualizacion',
                    ]
                )
                return {
                    "orden_id": str(orden.id),
                    "estado": orden.estado,
                    "idempotente": False,
                    "mensaje": orden.motivo_estado,
                }

            motivo_ok = (
                "Pago tardío conciliado con stock disponible remanente."
                if es_pago_tardio
                else "Pago confirmado e inventario consolidado."
            )
            orden.transicionar_estado(EstadoOrden.CONFIRMADA, motivo=motivo_ok, guardar=False)
            orden.save(
                update_fields=[
                    'estado',
                    'pago_confirmado_externo',
                    'pago_referencia',
                    'motivo_estado',
                    'fecha_actualizacion',
                ]
            )

            return {
                "orden_id": str(orden.id),
                "estado": orden.estado,
                "idempotente": False,
                "mensaje": motivo_ok,
            }
    except ErrorConciliacion:
        raise
    except Exception:
        # Compensación ante fallo en commit de PostgreSQL tras descuento en MongoDB
        _revertir_descuento_mongo(descuentos_aplicados)
        raise