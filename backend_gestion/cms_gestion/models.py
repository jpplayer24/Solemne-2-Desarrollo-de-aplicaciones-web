import uuid
from datetime import timedelta
from django.db import models
from django.utils import timezone


# SCRUM-39: Textos de Inicio y Quiénes Somos
class ContenidoPagina(models.Model):
    SECCIONES_CHOICES = [
        ('inicio', 'Inicio - Colecciones de Mochilas'),
        ('quienes_somos', 'Quiénes Somos - Materiales y Ergonomía'),
    ]
    seccion = models.CharField(max_length=50, choices=SECCIONES_CHOICES, unique=True)
    titulo = models.CharField(max_length=200)
    subtitulo = models.CharField(max_length=240, blank=True, null=True)
    contenido = models.TextField()
    materiales_ergonomia = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_seccion_display()} - {self.titulo}"


# SCRUM-40: Selección del tema visual activo entre los 4 aprobados
class ConfiguracionTema(models.Model):
    TEMAS_APROBADOS = [
        ('tema_1', 'Tema 1 - Clásico Urbano'),
        ('tema_2', 'Tema 2 - Oscuro Ejecutivo'),
        ('tema_3', 'Tema 3 - Verde Outdoor'),
        ('tema_4', 'Tema 4 - Minimalista Claro'),
    ]
    tema_activo = models.CharField(max_length=20, choices=TEMAS_APROBADOS, default='tema_1')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Tema activo: {self.tema_activo}"


# SCRUM-41: Mensajes de contacto
class MensajeContacto(models.Model):
    MOTIVOS_CHOICES = [
        ('garantia', 'Garantía'),
        ('dimensiones_cabina', 'Dimensiones de Cabina'),
        ('materiales', 'Materiales y Resistencia'),
        ('otro', 'Otra Consulta'),
    ]
    nombre = models.CharField(max_length=120)
    email = models.EmailField()
    telefono = models.CharField(max_length=30, blank=True, null=True)
    motivo = models.CharField(max_length=50, choices=MOTIVOS_CHOICES, default='dimensiones_cabina')
    mensaje = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} ({self.motivo}) - {self.email}"


# SCRUM-46: Clientes importados por CSV
class ClienteImportado(models.Model):
    email = models.EmailField(unique=True)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    rol = models.CharField(max_length=50, default='cliente')
    telefono = models.CharField(max_length=30, blank=True, null=True)
    estado = models.CharField(max_length=40, default='PENDIENTE_ACTIVACION')
    activo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} {self.apellido} <{self.email}> - [{self.estado}]"


# SCRUM-47: Enlaces de activación de un solo uso (24h)
def expira_en_24_horas():
    return timezone.now() + timedelta(hours=24)


class TokenActivacion(models.Model):
    cliente = models.ForeignKey(ClienteImportado, on_delete=models.CASCADE, related_name='tokens')
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    usado = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=expira_en_24_horas)

    def es_valido(self):
        return (not self.usado) and (timezone.now() <= self.expires_at)

    def __str__(self):
        return f"Token {self.token} - Usado: {self.usado}"