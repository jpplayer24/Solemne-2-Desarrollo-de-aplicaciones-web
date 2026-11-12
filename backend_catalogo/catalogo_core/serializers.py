# backend_catalogo/catalogo_core/serializers.py
from rest_framework import serializers

class ProductoSerializer(serializers.Serializer):
    sku = serializers.CharField(max_length=50, required=True)
    nombre = serializers.CharField(max_length=200, required=True)
    descripcion = serializers.CharField(required=True)
    categoria_id = serializers.CharField(max_length=100, required=True)
    precio = serializers.IntegerField(required=True)
    stock_inicial = serializers.IntegerField(default=0)
    moneda = serializers.CharField(default="CLP", max_length=10)
    imagenes = serializers.ListField(
        child=serializers.URLField(),
        required=True
    )
    estado_activo = serializers.BooleanField(default=True)

    # 1. Validación de precio estrictamente positivo (> 0)
    def validate_precio(self, value):
        if value <= 0:
            raise serializers.ValidationError("El precio debe ser un valor positivo estrictamente mayor a 0.")
        return value

    # 2. Validación de stock entero mayor o igual a 0 (>= 0)
    def validate_stock_inicial(self, value):
        if value < 0:
            raise serializers.ValidationError("El stock inicial no puede ser negativo; debe ser mayor o igual a 0.")
        return value

    # 3. Validación de imágenes (entre 4 y 6 URLs)
    def validate_imagenes(self, value):
        if not (4 <= len(value) <= 6):
            raise serializers.ValidationError("El producto debe incluir una galería de 4 a 6 imágenes.")
        return value


class ItemCarritoSerializer(serializers.Serializer):
    sku = serializers.CharField(max_length=100, required=True)
    cantidad = serializers.IntegerField(min_value=1, required=True)