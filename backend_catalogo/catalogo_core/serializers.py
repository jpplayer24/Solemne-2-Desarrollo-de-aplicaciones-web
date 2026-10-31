# backend_catalogo/catalogo_core/serializers.py
from rest_framework import serializers

class ProductoSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=200, required=True)
    descripcion = serializers.CharField(required=True)
    categoria_id = serializers.CharField(max_length=100, required=True)
    precio = serializers.IntegerField(required=True)
    stock_inicial = serializers.IntegerField(default=0)

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