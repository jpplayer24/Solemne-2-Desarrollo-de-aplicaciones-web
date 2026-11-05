from rest_framework import serializers
from .models import ContenidoPagina
from .models import ConfiguracionTema
from .models import MensajeContacto

class MensajeContactoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MensajeContacto
        fields = ['id', 'nombre', 'email', 'telefono', 'motivo', 'mensaje', 'created_at']

    def validate_nombre(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("El nombre debe tener al menos 2 caracteres.")
        return value.strip()

    def validate_mensaje(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("El mensaje debe detallar la consulta (mínimo 10 caracteres).")
        return value.strip()

class ConfiguracionTemaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionTema
        fields = ['id', 'tema_activo', 'updated_at']

    def validate_tema_activo(self, value):
        temas_validos = ['tema_1', 'tema_2', 'tema_3', 'tema_4']
        if value not in temas_validos:
            raise serializers.ValidationError(f"Tema no válido. Debe ser uno de los 4 aprobados: {temas_validos}")
        return value

class ContenidoPaginaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContenidoPagina
        fields = ['id', 'seccion', 'titulo', 'subtitulo', 'contenido', 'materiales_ergonomia', 'updated_at']