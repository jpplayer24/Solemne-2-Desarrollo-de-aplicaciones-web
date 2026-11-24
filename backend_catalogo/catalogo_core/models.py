import uuid
from datetime import timedelta
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


def default_expiracion_reserva():
    # Función de nivel de módulo requerida para serialización en migraciones de Django
    return timezone.now() + timedelta(minutes=15)


class EstadoOrden(models.TextChoices):
    PENDIENTE_PAGO = 'PENDIENTE_PAGO', 'Pendiente de Pago'
    CONFIRMACION_PENDIENTE = 'CONFIRMACION_PENDIENTE', 'Confirmación Pendiente'
    CONFIRMADA = 'CONFIRMADA', 'Confirmada'
    RECHAZADA = 'RECHAZADA', 'Rechazada'
    CANCELADA = 'CANCELADA', 'Cancelada'
    VENCIDA = 'VENCIDA', 'Vencida'
    REVISION_REQUERIDA = 'REVISION_REQUERIDA', 'Revisión Requerida'


TRANSICIONES_VALIDAS = {
    EstadoOrden.PENDIENTE_PAGO: {
        EstadoOrden.CONFIRMACION_PENDIENTE,
        EstadoOrden.CONFIRMADA,
        EstadoOrden.RECHAZADA,
        EstadoOrden.CANCELADA,
        EstadoOrden.VENCIDA,
        EstadoOrden.REVISION_REQUERIDA,
    },
    EstadoOrden.CONFIRMACION_PENDIENTE: {
        EstadoOrden.CONFIRMADA,
        EstadoOrden.RECHAZADA,
        EstadoOrden.VENCIDA,
        EstadoOrden.REVISION_REQUERIDA,
    },
    EstadoOrden.VENCIDA: {
        EstadoOrden.CONFIRMADA,
        EstadoOrden.REVISION_REQUERIDA,
        EstadoOrden.CANCELADA,
    },
    EstadoOrden.REVISION_REQUERIDA: {
        EstadoOrden.CONFIRMADA,
        EstadoOrden.CANCELADA,
        EstadoOrden.RECHAZADA,
    },
    EstadoOrden.CONFIRMADA: set(),
    EstadoOrden.RECHAZADA: set(),
    EstadoOrden.CANCELADA: set(),
}


class OrdenDeCompra(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario_id = models.CharField(max_length=100, null=True, blank=True)
    total_pagado = models.IntegerField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    fecha_expiracion_reserva = models.DateTimeField(default=default_expiracion_reserva)
    estado = models.CharField(
        max_length=30,
        choices=EstadoOrden.choices,
        default=EstadoOrden.PENDIENTE_PAGO,
        db_index=True,
    )
    pago_confirmado_externo = models.BooleanField(default=False)
    pago_referencia = models.CharField(max_length=120, null=True, blank=True, db_index=True)
    motivo_estado = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'ordenes_compra'

    @property
    def reserva_expirada(self):
        return self.estado == EstadoOrden.VENCIDA or timezone.now() > self.fecha_expiracion_reserva

    def puede_transicionar_a(self, nuevo_estado):
        permitidos = TRANSICIONES_VALIDAS.get(self.estado, set())
        return nuevo_estado in permitidos

    def transicionar_estado(self, nuevo_estado, motivo='', guardar=True):
        if nuevo_estado not in EstadoOrden.values:
            raise ValidationError(f"Estado destino inválido: '{nuevo_estado}'.")
        if self.estado == nuevo_estado:
            return self
        if not self.puede_transicionar_a(nuevo_estado):
            raise ValidationError(
                f"Transición prohibida: '{self.estado}' -> '{nuevo_estado}'."
            )
        self.estado = nuevo_estado
        if motivo:
            self.motivo_estado = motivo
        if guardar:
            self.save(update_fields=['estado', 'motivo_estado', 'fecha_actualizacion'])
        return self


class ItemOrden(models.Model):
    orden = models.ForeignKey(OrdenDeCompra, related_name='items', on_delete=models.CASCADE)
    sku = models.CharField(max_length=100)
    cantidad = models.IntegerField()
    precio_unitario_fijo = models.IntegerField()
    subtotal = models.IntegerField()

    class Meta:
        db_table = 'items_orden'