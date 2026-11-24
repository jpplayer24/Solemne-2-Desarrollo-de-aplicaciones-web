# backend_catalogo/catalogo_core/serializers.py
from rest_framework import serializers

class ProductoSerializer(serializers.Serializer):
    sku = serializers.CharField(max_length=50, required=False, allow_blank=True)
    nombre = serializers.CharField(max_length=200, required=True)
    descripcion = serializers.CharField(required=True)
    categoria_id = serializers.CharField(max_length=100, required=True)
    precio = serializers.IntegerField(required=True)

    capacidad_litros = serializers.IntegerField(
        required=True,
        min_value=1
    )
    badge = serializers.CharField(
        max_length=100,
        required=True
    )

    stock_inicial = serializers.IntegerField(default=0)
    stock_reservado = serializers.IntegerField(
        default=0,
        min_value=0
    )

    moneda = serializers.CharField(default="CLP", max_length=10)
    imagenes = serializers.ListField(
        child=serializers.URLField(),
        required=True
    )
    estado_activo = serializers.BooleanField(default=True)

    # 1. Validar que el precio sea positivo
    def validate_precio(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "El precio debe ser mayor a 0."
            )
        return value

    # 2. Validar que el stock inicial no sea negativo
    def validate_stock_inicial(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "El stock inicial no puede ser negativo."
            )
        return value

    # 3. Validar que las imágenes sean entre 4 y 6
    def validate_imagenes(self, value):
        if not (4 <= len(value) <= 6):
            raise serializers.ValidationError(
                "El producto debe incluir una galería de 4 a 6 imágenes."
            )
        return value

    # 4. Validar que el stock reservado no supere el inicial
    def validate(self, attrs):
        stock_inicial = attrs.get("stock_inicial", 0)
        stock_reservado = attrs.get("stock_reservado", 0)

        if stock_reservado > stock_inicial:
            raise serializers.ValidationError({
                "stock_reservado": (
                    "El stock reservado no puede superar "
                    "el stock inicial."
                )
            })

        return attrs


class ItemCarritoSerializer(serializers.Serializer):
    sku = serializers.CharField(max_length=100, required=True)
    cantidad = serializers.IntegerField(min_value=1, required=True)
