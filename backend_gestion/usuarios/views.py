from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

User = get_user_model()


class RegistroPublicoView(APIView):
  # Permitimos que cualquier usuario (incluso sin registrar) pueda acceder a este endpoint
  permission_classes = [AllowAny]

  def post(self, request):
    email = request.data.get('email')
    password = request.data.get('password')
    nombre = request.data.get('nombre', '')
    apellido = request.data.get('apellido', '')

    # 1. Validar que los campos obligatorios vengan en la petición
    if not email or not password:
      return Response(
          {'error': 'El correo y la contraseña son obligatorios.'},
          status=status.HTTP_400_BAD_REQUEST,
      )

    # 2. Validar la unicidad del correo (RF-07)
    if User.objects.filter(email=email).exists():
      return Response(
          {'error': 'El correo electrónico ya se encuentra registrado.'},
          status=status.HTTP_400_BAD_REQUEST,
      )

    try:
      # 3. Crear el usuario:
      # - Django aplica AUTOMÁTICAMENTE el Hashing a la contraseña con create_user().
      # - Forzamos explícitamente el rol a 'Cliente' (SCRUM-30).
      nuevo_usuario = User.objects.create_user(
          username=email,  # Usamos el email como username
          email=email,
          password=password,
          first_name=nombre,
          last_name=apellido,
          rol='Cliente',  # <-- REGLA: Exclusivamente clientes en el registro público
      )

      return Response(
          {
              'mensaje': (
                  '¡Usuario registrado exitosamente como Cliente con éxito!'
              ),
              'usuario': {
                  'email': nuevo_usuario.email,
                  'nombre': nuevo_usuario.first_name,
                  'rol': nuevo_usuario.rol,
              },
          },
          status=status.HTTP_201_CREATED,
      )

    except Exception as e:
      return Response(
          {'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
      )