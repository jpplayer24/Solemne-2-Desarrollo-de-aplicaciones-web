from django.test import TestCase

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

class AutenticacionTests(APITestCase):

    def setUp(self):
        # Crear un usuario de prueba para cada test
        self.usuario = User.objects.create_user(
            username='usuario_test',
            password='ClavePrueba777'
        )

        self.token = Token.objects.create(user=self.usuario)
        # Obtener las URL de autenticación
        self.url_login = reverse('login')
        self.url_logout = reverse('logout')
        self.url_me = reverse('me')

    def test_acceso_me_sin_token(self):
        response = self.client.get(self.url_me)
        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_acceso_me_con_token_invalido(self):
        self.client.credentials(
            HTTP_AUTHORIZATION='Token token_invalido'
        )

        response = self.client.get(self.url_me)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_acceso_me_con_token_valido(self):
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Token {self.token.key}'
        )
        response = self.client.get(self.url_me)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        
        self.assertEqual(
        response.data['username'],
        'usuario_test'
        )

    def test_login_con_credenciales_validas(self):
        response = self.client.post(
            self.url_login,
            {
                'username': 'usuario_test',
                'password': 'ClavePrueba777'
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertIn('token', response.data)
        self.assertEqual(
            response.data['username'],
            'usuario_test'
        )

    def test_logout_invalida_token(self):
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Token {self.token.key}'
        )

        response_logout = self.client.post(self.url_logout)

        self.assertEqual(
            response_logout.status_code,
            status.HTTP_200_OK
        )

        # Comprobar que el token se elimina de la BD
        self.assertFalse(
            Token.objects.filter(key=self.token.key).exists()
        )

        # Intentar acceder usando el mismo token
        response_me = self.client.get(self.url_me)

        self.assertEqual(
            response_me.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_logout_sin_token(self):
        response = self.client.post(self.url_logout)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )