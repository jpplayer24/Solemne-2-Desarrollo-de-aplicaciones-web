
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase
from rest_framework import status


User = get_user_model()


class AuthenticationTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="cliente_test",
            email="cliente@test.com",
            password="TestPassword123!"
        )

        self.login_url = "/api/auth/login/"
        self.logout_url = "/api/auth/logout/"
        self.me_url = "/api/auth/me/"

    def test_login_correcto(self):
        response = self.client.post(
            self.login_url,
            {
                "email": "cliente@test.com",
                "password": "TestPassword123!"
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertEqual(response.data["user"]["role"], "CLIENTE")

    def test_login_con_contrasena_incorrecta(self):
        response = self.client.post(
            self.login_url,
            {
                "email": "cliente@test.com",
                "password": "incorrecta"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_acceso_sin_token(self):
        response = self.client.get(self.me_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_acceso_con_token_invalido(self):
        self.client.credentials(
            HTTP_AUTHORIZATION="Token token_invalido"
        )

        response = self.client.get(self.me_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_acceso_con_token_valido(self):
        token = Token.objects.create(user=self.user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {token.key}"
        )

        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "cliente@test.com")

    def test_logout_invalida_token(self):
        token = Token.objects.create(user=self.user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {token.key}"
        )

        response_logout = self.client.post(self.logout_url)

        self.assertEqual(
            response_logout.status_code,
            status.HTTP_200_OK
        )

        self.assertFalse(
            Token.objects.filter(key=token.key).exists()
        )

        response_me = self.client.get(self.me_url)

        self.assertEqual(
            response_me.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_logout_sin_autenticacion(self):
        response = self.client.post(self.logout_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )
