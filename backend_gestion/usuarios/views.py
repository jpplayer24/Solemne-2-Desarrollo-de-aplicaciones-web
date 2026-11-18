from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    usuario = authenticate(username=username, password=password)

    if usuario is None:
        return Response(
            {'error': 'Credenciales incorrectas'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    token, created = Token.objects.get_or_create(user=usuario)

    return Response({
        'token': token.key,
        'username': usuario.username,
        'is_staff': usuario.is_staff
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    request.auth.delete()

    return Response(
        {'mensaje': 'Sesión cerrada correctamente'},
        status=status.HTTP_200_OK
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    usuario = request.user

    return Response({
        'id': usuario.id,
        'username': usuario.username,
        'is_staff': usuario.is_staff
    })
