from django.db import models
import uuid

class OrdenDeCompra(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario_id = models.CharField(max_length=100, null=True, blank=True)
    total_pagado = models.IntegerField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=50, default='PENDIENTE')

    class Meta:
        db_table = 'ordenes_compra'

class ItemOrden(models.Model):
    orden = models.ForeignKey(OrdenDeCompra, related_name='items', on_delete=models.CASCADE)
    sku = models.CharField(max_length=100)
    cantidad = models.IntegerField()
    precio_unitario_fijo = models.IntegerField() # EL SNAPSHOT: Este precio nunca cambiará aunque en MongoDB suba
    subtotal = models.IntegerField()

    class Meta:
        db_table = 'items_orden'