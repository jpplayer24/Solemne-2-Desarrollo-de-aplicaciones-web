from rest_framework import serializers

class ProductoSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200, required=True)
    description = serializers.CharField(required=True)
    category_id = serializers.CharField(max_length=100, required=True)
    price = serializers.IntegerField(required=True)
    currency = serializers.CharField(default="CLP", max_length=10)
    images = serializers.ListField(
        child=serializers.URLField(),
        required=True
    )
    initial_stock = serializers.IntegerField(default=0)
    status = serializers.ChoiceField(
        choices=["draft", "published", "inactive"],
        default="draft"
    )

    # 1. Validación de precio estrictamente positivo (> 0)
    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("El precio debe ser un valor positivo estrictamente mayor a 0.")
        return value

    # 2. Validación de stock entero mayor o igual a 0 (>= 0)
    def validate_initial_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("El stock inicial no puede ser negativo; debe ser mayor o igual a 0.")
        return value

    # 3. Validación de imágenes (entre 4 y 6 imágenes válidas según el contrato)
    def validate_images(self, value):
        if not (4 <= len(value) <= 6):
            raise serializers.ValidationError("Un producto debe incluir entre 4 y 6 imágenes válidas.")
        return value
