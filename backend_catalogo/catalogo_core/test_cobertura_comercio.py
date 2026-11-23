import copy
import uuid
from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import patch
from bson.objectid import ObjectId
from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone
from pymongo.errors import PyMongoError
from rest_framework import status
from rest_framework.test import APITestCase
from .models import EstadoOrden, ItemOrden, OrdenDeCompra
from .reconciliation import conciliar_pago_orden
from .serializers import ProductoSerializer


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
    def __init__(self, store, fail_on_transaction=False):
        self._store = store
        self._fail_on_transaction = fail_on_transaction

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        return False

    def start_transaction(self):
        if self._fail_on_transaction:
            raise PyMongoError("Fallo simulado de sesion en MongoDB")
        return FakeTransaction(self._store)


class FakeMongoClient:
    def __init__(self, store, fail_on_transaction=False):
        self._store = store
        self._fail_on_transaction = fail_on_transaction

    def start_session(self):
        return FakeSession(self._store, self._fail_on_transaction)


class FakeCursor:
    def __init__(self, docs):
        self._docs = docs
        self._skip = 0
        self._limit = None

    def skip(self, cantidad):
        self._skip = cantidad
        return self

    def limit(self, cantidad):
        self._limit = cantidad
        return self

    def __iter__(self):
        segmento = self._docs[self._skip:]
        if self._limit is not None:
            segmento = segmento[:self._limit]
        return iter(segmento)


class FakeProductosCollection:
    def __init__(self, store):
        self._store = store

    def _activos(self):
        return [
            copy.deepcopy({k: v for k, v in doc.items() if k != "_id"})
            for doc in self._store.values()
            if doc.get("estado_activo") is True
            or doc.get("activo") is True
            or doc.get("status") == "published"
        ]

    def count_documents(self, filtro):
        return len(self._activos())

    def find(self, filtro, projection=None):
        return FakeCursor(self._activos())

    def find_one(self, query, projection=None, session=None):
        if "_id" in query:
            for doc in self._store.values():
                if doc.get("_id") == query["_id"]:
                    return copy.deepcopy(doc)
            return None
        sku = query.get("sku")
        doc = self._store.get(sku)
        return copy.deepcopy(doc) if doc is not None else None

    def insert_one(self, doc):
        self._store[doc["sku"]] = copy.deepcopy(doc)
        return SimpleNamespace(inserted_id=doc["sku"])

    def update_one(self, filtro, actualizacion, session=None):
        sku = filtro.get("sku")
        doc = self._store.get(sku)
        if doc is None:
            return SimpleNamespace(modified_count=0)

        for campo in ("stock_inicial", "stock_fisico", "stock_reservado"):
            if campo in filtro and doc.get(campo, 0) < filtro[campo]["$gte"]:
                return SimpleNamespace(modified_count=0)

        if "$expr" in filtro:
            requerido = filtro["$expr"]["$gte"][1]

            stock_fisico = doc.get("stock_fisico")
            if stock_fisico is None:
                stock_fisico = doc.get("stock_inicial", 0)

            stock_reservado = doc.get("stock_reservado") or 0
            disponible = stock_fisico - stock_reservado

            if disponible < requerido:
                return SimpleNamespace(modified_count=0)

        for campo, delta in actualizacion.get("$inc", {}).items():
            doc[campo] = doc.get(campo, 0) + delta

        return SimpleNamespace(modified_count=1)


class FakeCarritosCollection:
    def __init__(self):
        self.data = {}

    def find_one(self, query):
        doc = self.data.get(query.get("usuario_id"))
        return copy.deepcopy(doc) if doc is not None else None

    def update_one(self, filtro, actualizacion, upsert=False):
        uid = filtro["usuario_id"]
        self.data[uid] = {
            "usuario_id": uid,
            "items": copy.deepcopy(actualizacion["$set"]["items"]),
        }
        return SimpleNamespace(modified_count=1)


class CoberturaComercioYCatalogoTests(APITestCase):
    def setUp(self):
        self.oid_urbana = ObjectId()
        self.mongo_store = {
            "MCH-URB-001": {
                "_id": self.oid_urbana,
                "sku": "MCH-URB-001",
                "nombre": "Mochila Urbana 20L",
                "descripcion": "Impermeable para laptop 15 pulgadas",
                "categoria_id": "URBANA",
                "precio": 45000,
                "stock_inicial": 5,
                "stock_reservado": 1,
                "moneda": "CLP",
                "imagenes": [
                    "https://example.com/1.jpg",
                    "https://example.com/2.jpg",
                    "https://example.com/3.jpg",
                    "https://example.com/4.jpg",
                ],
                "estado_activo": True,
            },
            "MCH-OUT-002": {
                "sku": "MCH-OUT-002",
                "nombre": "Mochila Outdoor 40L",
                "descripcion": "Cordura antidesgarro",
                "categoria_id": "OUTDOOR",
                "precio": 75000,
                "stock_fisico": 3,
                "stock_reservado": 2,
                "moneda": "CLP",
                "imagenes": [
                    "https://example.com/a.jpg",
                    "https://example.com/b.jpg",
                    "https://example.com/c.jpg",
                    "https://example.com/d.jpg",
                ],
                "estado_activo": True,
            },
            "MCH-INA-003": {
                "sku": "MCH-INA-003",
                "nombre": "Mochila Descontinuada",
                "precio": 30000,
                "stock_inicial": 10,
                "stock_reservado": 0,
                "estado_activo": False,
            },
        }
        self.fake_client = FakeMongoClient(self.mongo_store)
        self.fake_collection = FakeProductosCollection(self.mongo_store)
        self.fake_carritos = FakeCarritosCollection()

        self.cliente_user = User.objects.create_user(
            username="cliente_normal", password="PasswordSegura123!"
        )
        self.admin_user = User.objects.create_user(
            username="admin_packcraft",
            password="PasswordAdmin123!",
            is_staff=True,
            is_superuser=True,
        )

        self.patchers = [
            patch("catalogo_core.reconciliation.client", self.fake_client),
            patch("catalogo_core.views.client", self.fake_client),
            patch(
                "catalogo_core.reconciliation.get_productos_collection",
                return_value=self.fake_collection,
            ),
            patch(
                "catalogo_core.views.get_productos_collection",
                return_value=self.fake_collection,
            ),
            patch("catalogo_core.views.db", {"carritos": self.fake_carritos}),
        ]
        for p in self.patchers:
            p.start()

    def tearDown(self):
        for p in self.patchers:
            p.stop()

    def _crear_orden(self, sku="MCH-OUT-002", cantidad=2, precio=75000, estado=EstadoOrden.PENDIENTE_PAGO):
        orden = OrdenDeCompra.objects.create(
            usuario_id=str(self.cliente_user.id),
            total_pagado=precio * cantidad,
            estado=estado,
            fecha_expiracion_reserva=timezone.now() + timedelta(minutes=15),
        )
        ItemOrden.objects.create(
            orden=orden,
            sku=sku,
            cantidad=cantidad,
            precio_unitario_fijo=precio,
            subtotal=precio * cantidad,
        )
        return orden

    # --- Health Check (urls.py) ---
    def test_health_check_operativo_y_caido(self):
        with patch("catalogo_core.urls.check_mongo_connection", return_value=(True, "OK")):
            r_ok = self.client.get(reverse("health_check"))
            self.assertEqual(r_ok.status_code, status.HTTP_200_OK)

        with patch("catalogo_core.urls.check_mongo_connection", return_value=(False, "Sin red")):
            r_fail = self.client.get(reverse("health_check"))
            self.assertEqual(r_fail.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    # --- Carrito y Fusion Post-Login (SincronizarCarritoView) ---
    def test_sincronizar_carrito_invitado_y_descarte_sin_stock(self):
        url = reverse("sincronizar_carrito")
        payload = [
            {"sku": "MCH-URB-001", "cantidad": 2},
            {"sku": "MCH-OUT-002", "cantidad": 5},  # disponible=1, se descarta
            {"sku": "SKU-NO-EXISTE", "cantidad": 1},
        ]
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["total_carrito"], 90000)
        self.assertEqual(len(resp.data["detalle"]), 1)

    def test_sincronizar_carrito_autenticado_fusiona_cantidades(self):
        self.fake_carritos.data[str(self.cliente_user.id)] = {
            "usuario_id": str(self.cliente_user.id),
            "items": [{"sku": "MCH-URB-001", "cantidad": 1}],
        }
        self.client.force_authenticate(user=self.cliente_user)
        url = reverse("sincronizar_carrito")
        resp = self.client.post(url, [{"sku": "MCH-URB-001", "cantidad": 2}], format="json")

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["detalle"][0]["cantidad"], 3)
        self.assertEqual(resp.data["total_carrito"], 135000)
        self.assertEqual(
            self.fake_carritos.data[str(self.cliente_user.id)]["items"],
            [{"sku": "MCH-URB-001", "cantidad": 3}],
        )

    def test_sincronizar_carrito_payload_invalido(self):
        resp = self.client.post(
            reverse("sincronizar_carrito"), [{"sku": "MCH-URB-001", "cantidad": 0}], format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Creacion de Orden y Snapshot (ProcesarOrdenView) ---
    def test_procesar_orden_exito_ignora_precio_frontend_y_casos_error(self):
        url = reverse("crear_orden")

        # Carrito vacio
        self.assertEqual(
            self.client.post(url, {"items": []}, format="json").status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        # Cantidad invalida
        self.assertEqual(
            self.client.post(url, {"items": [{"sku": "MCH-URB-001", "cantidad": -2}]}, format="json").status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        # Sin stock suficiente
        self.assertEqual(
            self.client.post(url, {"items": [{"sku": "MCH-OUT-002", "cantidad": 3}]}, format="json").status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        # Exito ignorando precio alterado en payload (CC-06)
        resp_ok = self.client.post(
            url,
            {"items": [{"sku": "MCH-URB-001", "cantidad": 2, "precio": 1}]},
            format="json",
        )
        self.assertEqual(resp_ok.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp_ok.data["total"], 90000)
        self.assertEqual(resp_ok.data["estado"], EstadoOrden.PENDIENTE_PAGO)

        # Error interno de persistencia en BD -> 500
        with patch("catalogo_core.views.OrdenDeCompra.objects.create", side_effect=RuntimeError("DB down")):
            resp_err = self.client.post(
                url, {"items": [{"sku": "MCH-URB-001", "cantidad": 1}]}, format="json"
            )
            self.assertEqual(resp_err.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    # --- Maquina de Estados (TransicionarEstadoOrdenView + models.py) ---
    def test_transicionar_estado_validaciones_y_idempotencia(self):
        orden = self._crear_orden()
        url = reverse("transicionar_estado_orden", args=[orden.id])

        # Falta campo estado -> 400
        self.assertEqual(self.client.post(url, {}, format="json").status_code, status.HTTP_400_BAD_REQUEST)

        # Orden inexistente -> 404
        url_404 = reverse("transicionar_estado_orden", args=[uuid.uuid4()])
        self.assertEqual(
            self.client.post(url_404, {"estado": EstadoOrden.CANCELADA}, format="json").status_code,
            status.HTTP_404_NOT_FOUND,
        )

        # Mismo estado (idempotente) -> 200
        r_same = self.client.post(url, {"estado": EstadoOrden.PENDIENTE_PAGO}, format="json")
        self.assertEqual(r_same.status_code, status.HTTP_200_OK)
        self.assertEqual(r_same.data["estado_actual"], EstadoOrden.PENDIENTE_PAGO)

    # --- Conciliacion, Reservas, Errores y Reversion (ConciliarPagoOrdenView + reconciliation.py) ---
    def test_conciliar_pago_validaciones_request(self):
        orden = self._crear_orden()
        url = reverse("conciliar_pago_orden", args=[orden.id])

        self.assertEqual(
            self.client.post(url, {"monto_pagado": True, "pago_referencia": "R1"}, format="json").status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            self.client.post(url, {"monto_pagado": 150000, "pago_referencia": ""}, format="json").status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            self.client.post(
                url, {"monto_pagado": 150000, "pago_referencia": "R1", "pago_aprobado": "si"}, format="json"
            ).status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_conciliar_pago_orden_inexistente_y_estado_terminal(self):
        url_404 = reverse("conciliar_pago_orden", args=[uuid.uuid4()])
        r404 = self.client.post(
            url_404, {"monto_pagado": 45000, "pago_referencia": "TX-404", "pago_aprobado": True}, format="json"
        )
        self.assertEqual(r404.status_code, status.HTTP_404_NOT_FOUND)

        orden_cancelada = self._crear_orden(estado=EstadoOrden.CANCELADA)
        url_409 = reverse("conciliar_pago_orden", args=[orden_cancelada.id])
        r409 = self.client.post(
            url_409, {"monto_pagado": 150000, "pago_referencia": "TX-409", "pago_aprobado": True}, format="json"
        )
        self.assertEqual(r409.status_code, status.HTTP_409_CONFLICT)

    def test_conciliar_pago_rechazado_y_pago_normal_con_reserva_previa(self):
        orden_rech = self._crear_orden()
        r_rech = self.client.post(
            reverse("conciliar_pago_orden", args=[orden_rech.id]),
            {"monto_pagado": 150000, "pago_referencia": "TX-NO", "pago_aprobado": False},
            format="json",
        )
        self.assertEqual(r_rech.status_code, status.HTTP_200_OK)
        self.assertEqual(r_rech.data["estado"], EstadoOrden.RECHAZADA)

        orden_res = self._crear_orden(sku="MCH-OUT-002", cantidad=2, precio=75000)
        r_ok = self.client.post(
            reverse("conciliar_pago_orden", args=[orden_res.id]),
            {"monto_pagado": 150000, "pago_referencia": "TX-RES", "pago_aprobado": True},
            format="json",
        )
        self.assertEqual(r_ok.status_code, status.HTTP_200_OK)
        self.assertEqual(r_ok.data["estado"], EstadoOrden.CONFIRMADA)
        self.assertEqual(self.mongo_store["MCH-OUT-002"]["stock_fisico"], 1)
        self.assertEqual(self.mongo_store["MCH-OUT-002"]["stock_reservado"], 0)

    def test_conciliar_sku_inexistente_pymongo_error_y_reversion_pg(self):
        orden_sku = self._crear_orden(sku="SKU-BORRADO", cantidad=1, precio=10000)
        r_sku = self.client.post(
            reverse("conciliar_pago_orden", args=[orden_sku.id]),
            {"monto_pagado": 10000, "pago_referencia": "TX-SKU", "pago_aprobado": True},
            format="json",
        )
        self.assertEqual(r_sku.status_code, status.HTTP_200_OK)
        self.assertEqual(r_sku.data["estado"], EstadoOrden.REVISION_REQUERIDA)

        orden_mongo = self._crear_orden(sku="MCH-URB-001", cantidad=1, precio=45000)
        failing_client = FakeMongoClient(self.mongo_store, fail_on_transaction=True)
        with patch("catalogo_core.reconciliation.client", failing_client):
            r_err = self.client.post(
                reverse("conciliar_pago_orden", args=[orden_mongo.id]),
                {"monto_pagado": 45000, "pago_referencia": "TX-MERR", "pago_aprobado": True},
                format="json",
            )
        self.assertEqual(r_err.status_code, status.HTTP_200_OK)
        self.assertEqual(r_err.data["estado"], EstadoOrden.REVISION_REQUERIDA)

        # Fallo al persistir en PostgreSQL tras descontar en MongoDB -> revierte stock
        orden_rev = self._crear_orden(sku="MCH-URB-001", cantidad=1, precio=45000)
        stock_antes = self.mongo_store["MCH-URB-001"]["stock_inicial"]
        reservado_antes = self.mongo_store["MCH-URB-001"]["stock_reservado"]
        with patch.object(OrdenDeCompra, "save", side_effect=RuntimeError("Error commit PG")):
            with self.assertRaises(RuntimeError):
                conciliar_pago_orden(orden_rev.id, 45000, "TX-REV-PG", pago_aprobado=True)
        self.assertEqual(self.mongo_store["MCH-URB-001"]["stock_inicial"], stock_antes)
        self.assertEqual(self.mongo_store["MCH-URB-001"]["stock_reservado"], reservado_antes)

    # --- Catalogo Paginado, Detalle y Creacion Admin ---
    def test_listar_y_detalle_productos(self):
        url_lista = reverse("listar_productos_paginado")

        r1 = self.client.get(f"{url_lista}?page=1&limit=100")
        self.assertEqual(r1.status_code, status.HTTP_200_OK)
        self.assertEqual(r1.json()["paginacion"]["por_pagina"], 50)
        self.assertEqual(r1.json()["paginacion"]["total_registros"], 2)

        r2 = self.client.get(f"{url_lista}?page=invalido&limit=0")
        self.assertEqual(r2.status_code, status.HTTP_200_OK)
        self.assertEqual(r2.json()["paginacion"]["por_pagina"], 10)

        r3 = self.client.get(f"{url_lista}?page=-1&limit=-5")
        self.assertEqual(r3.status_code, status.HTTP_200_OK)
        self.assertEqual(r3.json()["paginacion"]["pagina_actual"], 1)

        r_det_oid = self.client.get(reverse("detalle_producto", args=[str(self.oid_urbana)]))
        self.assertEqual(r_det_oid.status_code, status.HTTP_200_OK)
        self.assertEqual(r_det_oid.json()["data"]["sku"], "MCH-URB-001")

        r_det_sku = self.client.get(reverse("detalle_producto", args=["MCH-OUT-002"]))
        self.assertEqual(r_det_sku.status_code, status.HTTP_200_OK)

        r_det_404 = self.client.get(reverse("detalle_producto", args=["SKU-404"]))
        self.assertEqual(r_det_404.status_code, status.HTTP_404_NOT_FOUND)

    def test_crear_producto_rbac_y_validaciones(self):
        url = reverse("crear_producto")
        payload_valido = {
            "sku": "MCH-NEW-999",
            "nombre": "Mochila Viaje 35L",
            "descripcion": "Cabina avion",
            "precio": 65000,
            "capacidad_litros": 35,
            "badge": "Nuevo",
            "stock_inicial": 8,
            "imagenes": [
                "https://example.com/1.jpg",
                "https://example.com/2.jpg",
                "https://example.com/3.jpg",
                "https://example.com/4.jpg",
            ],
        }

        # Cliente comun bloqueado con 403 (RBAC)
        self.client.force_authenticate(user=self.cliente_user)
        self.assertEqual(
            self.client.post(url, payload_valido, format="json").status_code,
            status.HTTP_403_FORBIDDEN,
        )

        # Admin crea producto -> 201
        self.client.force_authenticate(user=self.admin_user)
        r_ok = self.client.post(url, payload_valido, format="json")
        self.assertEqual(r_ok.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r_ok.data["producto"]["categoria_id"], "GENERAL")
        self.assertEqual(r_ok.data["producto"]["stock_reservado"], 0)

        # Creacion con SKU en blanco genera identificador automatico -> 201
        r_auto = self.client.post(url, {**payload_valido, "sku": "   "}, format="json")
        self.assertEqual(r_auto.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(r_auto.data["producto"]["sku"]), 10)

        # SKU duplicado -> 400
        self.assertEqual(
            self.client.post(url, payload_valido, format="json").status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        # Validaciones negativas del serializador -> 400
        for malo in (
            {**payload_valido, "sku": "M1", "precio": True},
            {**payload_valido, "sku": "M2", "precio": "caro"},
            {**payload_valido, "sku": "M3", "precio": 0},
            {**payload_valido, "sku": "M4", "nombre": "   "},
            {**payload_valido, "sku": "M5", "capacidad_litros": 0},
            {**payload_valido, "sku": "M6", "badge": ""},
            {**payload_valido, "sku": "M7", "imagenes": ["https://example.com/1.jpg"]},
            {**payload_valido, "sku": "M8", "stock_reservado": 99},
        ):
            self.assertEqual(
                self.client.post(url, malo, format="json").status_code,
                status.HTTP_400_BAD_REQUEST,
            )

        # Fallo interno de MongoDB al insertar -> 500
        with patch.object(self.fake_collection, "insert_one", side_effect=RuntimeError("Mongo fallo")):
            r_err = self.client.post(
                url, {**payload_valido, "sku": "MCH-ERR-500"}, format="json"
            )
            self.assertEqual(r_err.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_producto_serializer_validaciones(self):
        base = {
            "sku": "MCH-SER-01",
            "nombre": "Mochila Tactica",
            "descripcion": "Resistente al agua",
            "categoria_id": "OUTDOOR",
            "precio": 55000,
            "capacidad_litros": 40,
            "badge": "Impermeable",
            "stock_inicial": 4,
            "stock_reservado": 1,
            "imagenes": [
                "https://example.com/1.jpg",
                "https://example.com/2.jpg",
                "https://example.com/3.jpg",
                "https://example.com/4.jpg",
            ],
        }
        self.assertTrue(ProductoSerializer(data=base).is_valid())
        self.assertFalse(ProductoSerializer(data={**base, "precio": 0}).is_valid())
        self.assertFalse(ProductoSerializer(data={**base, "stock_inicial": -1}).is_valid())
        self.assertFalse(ProductoSerializer(data={**base, "imagenes": ["https://example.com/1.jpg"]}).is_valid())

        ser_stock_invalido = ProductoSerializer(data={**base, "stock_reservado": 10})
        self.assertFalse(ser_stock_invalido.is_valid())
        self.assertIn("stock_reservado", ser_stock_invalido.errors)