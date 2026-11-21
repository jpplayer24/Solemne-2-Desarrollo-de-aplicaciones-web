import copy
from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import patch
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from .models import EstadoOrden, ItemOrden, OrdenDeCompra


class FakeTransaction:
    def __init__(self, store):
        self._store = store
        self._snapshot = None

    def __enter__(self):
        self._snapshot = copy.deepcopy(self._store)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self._store.clear()
            self._store.update(self._snapshot)
        return False


class FakeSession:
    def __init__(self, store):
        self._store = store

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        return False

    def start_transaction(self):
        return FakeTransaction(self._store)


class FakeMongoClient:
    def __init__(self, store):
        self._store = store

    def start_session(self):
        return FakeSession(self._store)


class FakeProductosCollection:
    def __init__(self, store):
        self._store = store

    def find_one(self, query, projection=None, session=None):
        sku = query.get("sku")
        doc = self._store.get(sku)
        return copy.deepcopy(doc) if doc is not None else None

    def update_one(self, filtro, actualizacion, session=None):
        sku = filtro.get("sku")
        doc = self._store.get(sku)
        if doc is None:
            return SimpleNamespace(modified_count=0)

        if "stock_inicial" in filtro:
            if doc.get("stock_inicial", 0) < filtro["stock_inicial"]["$gte"]:
                return SimpleNamespace(modified_count=0)

        if "stock_fisico" in filtro:
            if doc.get("stock_fisico", 0) < filtro["stock_fisico"]["$gte"]:
                return SimpleNamespace(modified_count=0)

        if "stock_reservado" in filtro:
            if doc.get("stock_reservado", 0) < filtro["stock_reservado"]["$gte"]:
                return SimpleNamespace(modified_count=0)

        if "$expr" in filtro:
            requerido = filtro["$expr"]["$gte"][1]
            disponible = doc.get("stock_fisico", 0) - doc.get("stock_reservado", 0)
            if disponible < requerido:
                return SimpleNamespace(modified_count=0)

        for campo, delta in actualizacion.get("$inc", {}).items():
            doc[campo] = doc.get(campo, 0) + delta

        return SimpleNamespace(modified_count=1)


class MaquinaEstadosYConciliacionTests(APITestCase):
    def setUp(self):
        self.mongo_store = {
            "MCH-URB-001": {
                "sku": "MCH-URB-001",
                "nombre": "Mochila Urbana 20L",
                "precio": 45000,
                "stock_inicial": 2,
            },
            "MCH-EXP-002": {
                "sku": "MCH-EXP-002",
                "nombre": "Mochila Expedicion 50L",
                "precio": 89000,
                "stock_fisico": 1,
                "stock_reservado": 0,
            },
        }
        self.fake_client = FakeMongoClient(self.mongo_store)
        self.fake_collection = FakeProductosCollection(self.mongo_store)

        self.patcher_rec_client = patch(
            "catalogo_core.reconciliation.client", self.fake_client
        )
        self.patcher_rec_col = patch(
            "catalogo_core.reconciliation.get_productos_collection",
            return_value=self.fake_collection,
        )
        self.patcher_views_col = patch(
            "catalogo_core.views.get_productos_collection",
            return_value=self.fake_collection,
        )

        self.patcher_rec_client.start()
        self.patcher_rec_col.start()
        self.patcher_views_col.start()

    def tearDown(self):
        self.patcher_rec_client.stop()
        self.patcher_rec_col.stop()
        self.patcher_views_col.stop()

    def _crear_orden_prueba(self, sku="MCH-URB-001", cantidad=1, precio=45000, expirada=False):
        expiracion = (
            timezone.now() - timedelta(minutes=20)
            if expirada
            else timezone.now() + timedelta(minutes=15)
        )
        orden = OrdenDeCompra.objects.create(
            usuario_id="cliente_test",
            total_pagado=precio * cantidad,
            estado=EstadoOrden.PENDIENTE_PAGO,
            fecha_expiracion_reserva=expiracion,
        )
        ItemOrden.objects.create(
            orden=orden,
            sku=sku,
            cantidad=cantidad,
            precio_unitario_fijo=precio,
            subtotal=precio * cantidad,
        )
        return orden

    def test_scrum61_transiciones_validas_hasta_confirmada(self):
        orden = self._crear_orden_prueba()
        url = reverse("transicionar_estado_orden", args=[orden.id])

        r1 = self.client.post(url, {"estado": EstadoOrden.CONFIRMACION_PENDIENTE}, format="json")
        self.assertEqual(r1.status_code, status.HTTP_200_OK)
        self.assertEqual(r1.data["estado_actual"], EstadoOrden.CONFIRMACION_PENDIENTE)

        r2 = self.client.post(url, {"estado": EstadoOrden.CONFIRMADA}, format="json")
        self.assertEqual(r2.status_code, status.HTTP_200_OK)
        self.assertEqual(r2.data["estado_actual"], EstadoOrden.CONFIRMADA)

        r3 = self.client.post(url, {"estado": EstadoOrden.CANCELADA}, format="json")
        self.assertEqual(r3.status_code, status.HTTP_409_CONFLICT)

    def test_scrum61_orden_cancelada_no_puede_confirmarse(self):
        orden = self._crear_orden_prueba()
        url = reverse("transicionar_estado_orden", args=[orden.id])

        r1 = self.client.post(
            url, {"estado": EstadoOrden.CANCELADA, "motivo": "Cancelacion usuario"}, format="json"
        )
        self.assertEqual(r1.status_code, status.HTTP_200_OK)

        r2 = self.client.post(url, {"estado": EstadoOrden.CONFIRMADA}, format="json")
        self.assertEqual(r2.status_code, status.HTTP_409_CONFLICT)

    def test_scrum61_rechaza_estado_inexistente(self):
        orden = self._crear_orden_prueba()
        url = reverse("transicionar_estado_orden", args=[orden.id])

        resp = self.client.post(url, {"estado": "ESTADO_INVALIDO"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_409_CONFLICT)

    def test_scrum64_pago_normal_confirma_y_descuenta_stock(self):
        orden = self._crear_orden_prueba(sku="MCH-URB-001", cantidad=1, precio=45000, expirada=False)
        url = reverse("conciliar_pago_orden", args=[orden.id])

        resp = self.client.post(
            url,
            {"monto_pagado": 45000, "pago_referencia": "TX-OK-01", "pago_aprobado": True},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["estado"], EstadoOrden.CONFIRMADA)
        self.assertEqual(self.mongo_store["MCH-URB-001"]["stock_inicial"], 1)

    def test_scrum64_pago_tardio_sin_stock_pasa_a_revision_sin_negativo(self):
        self.mongo_store["MCH-EXP-002"]["stock_fisico"] = 0
        orden = self._crear_orden_prueba(sku="MCH-EXP-002", cantidad=1, precio=89000, expirada=True)
        url = reverse("conciliar_pago_orden", args=[orden.id])

        resp = self.client.post(
            url,
            {"monto_pagado": 89000, "pago_referencia": "TX-TARDIA-01", "pago_aprobado": True},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["estado"], EstadoOrden.REVISION_REQUERIDA)
        self.assertEqual(self.mongo_store["MCH-EXP-002"]["stock_fisico"], 0)

        orden.refresh_from_db()
        self.assertTrue(orden.pago_confirmado_externo)
        self.assertEqual(orden.estado, EstadoOrden.REVISION_REQUERIDA)

    def test_scrum64_pago_tardio_con_stock_disponible_confirma_venta(self):
        orden = self._crear_orden_prueba(sku="MCH-EXP-002", cantidad=1, precio=89000, expirada=True)
        url = reverse("conciliar_pago_orden", args=[orden.id])

        resp = self.client.post(
            url,
            {"monto_pagado": 89000, "pago_referencia": "TX-TARDIA-02", "pago_aprobado": True},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["estado"], EstadoOrden.CONFIRMADA)
        self.assertEqual(self.mongo_store["MCH-EXP-002"]["stock_fisico"], 0)

    def test_scrum64_indivisibilidad_multisku_revierte_stock_en_fallo_parcial(self):
        self.mongo_store["MCH-EXP-002"]["stock_fisico"] = 0
        orden = OrdenDeCompra.objects.create(
            usuario_id="cliente_multi",
            total_pagado=134000,
            estado=EstadoOrden.VENCIDA,
            fecha_expiracion_reserva=timezone.now() - timedelta(minutes=30),
        )
        ItemOrden.objects.create(
            orden=orden, sku="MCH-URB-001", cantidad=1, precio_unitario_fijo=45000, subtotal=45000
        )
        ItemOrden.objects.create(
            orden=orden, sku="MCH-EXP-002", cantidad=1, precio_unitario_fijo=89000, subtotal=89000
        )

        url = reverse("conciliar_pago_orden", args=[orden.id])
        resp = self.client.post(
            url,
            {"monto_pagado": 134000, "pago_referencia": "TX-MULTI-01", "pago_aprobado": True},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["estado"], EstadoOrden.REVISION_REQUERIDA)
        # El descuento previo sobre MCH-URB-001 debe haberse revertido por la transaccion atomica
        self.assertEqual(self.mongo_store["MCH-URB-001"]["stock_inicial"], 2)
        self.assertEqual(self.mongo_store["MCH-EXP-002"]["stock_fisico"], 0)

    def test_scrum64_idempotencia_no_descuenta_dos_veces(self):
        orden = self._crear_orden_prueba(sku="MCH-URB-001", cantidad=1, precio=45000)
        url = reverse("conciliar_pago_orden", args=[orden.id])
        payload = {"monto_pagado": 45000, "pago_referencia": "TX-DUP-01", "pago_aprobado": True}

        r1 = self.client.post(url, payload, format="json")
        r2 = self.client.post(url, payload, format="json")

        self.assertEqual(r1.status_code, status.HTTP_200_OK)
        self.assertFalse(r1.data["idempotente"])
        self.assertEqual(r2.status_code, status.HTTP_200_OK)
        self.assertTrue(r2.data["idempotente"])
        self.assertEqual(self.mongo_store["MCH-URB-001"]["stock_inicial"], 1)

    def test_scrum64_discrepancia_monto_deriva_a_revision_sin_tocar_stock(self):
        orden = self._crear_orden_prueba(sku="MCH-URB-001", cantidad=1, precio=45000)
        url = reverse("conciliar_pago_orden", args=[orden.id])

        resp = self.client.post(
            url,
            {"monto_pagado": 1000, "pago_referencia": "TX-ALTERADA", "pago_aprobado": True},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["estado"], EstadoOrden.REVISION_REQUERIDA)
        self.assertEqual(self.mongo_store["MCH-URB-001"]["stock_inicial"], 2)

    def test_listar_ordenes_revision_requerida(self):
        self.mongo_store["MCH-EXP-002"]["stock_fisico"] = 0
        orden = self._crear_orden_prueba(sku="MCH-EXP-002", cantidad=1, precio=89000, expirada=True)
        self.client.post(
            reverse("conciliar_pago_orden", args=[orden.id]),
            {"monto_pagado": 89000, "pago_referencia": "TX-REV-01", "pago_aprobado": True},
            format="json",
        )

        resp = self.client.get(reverse("ordenes_revision"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["total"], 1)
        self.assertEqual(resp.data["ordenes"][0]["orden_id"], str(orden.id))