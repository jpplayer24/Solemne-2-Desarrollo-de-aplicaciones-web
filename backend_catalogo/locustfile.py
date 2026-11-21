from locust import HttpUser, task, between

class UsuarioCatalogo(HttpUser):
    # tiempo de espera entre solicitudes de cada usuario.
    wait_time = between(1, 3)

    @task
    def listar_productos(self):
        # consultar el catalogo de mochilas.
        with self.client.get(
            "/api/products/?page=1&limit=50",
            name="/api/products/",
            catch_response=True
        ) as respuesta:

            if respuesta.status_code == 200:
                datos = respuesta.json()

                # comprobar que la respuesta contenga productos.
                if datos.get("status") == "success" and len(datos.get("data", [])) > 0:
                    respuesta.success()
                else:
                    respuesta.failure("La respuesta no contiene productos")
            else:
                respuesta.failure(
                    f"Error HTTP: {respuesta.status_code}"
                )