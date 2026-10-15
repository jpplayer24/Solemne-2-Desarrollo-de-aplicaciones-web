Borrador para revisión del equipo
Arquitectura:React + Django REST Framework + PostgreSQL + MongoDB
Objetivo: Definir los endpoints, responsabilidades, permisos, entradas, respuestas y reglas de comunicación entre los tres servicios

1. Arquitectura y propiedad de los datos

Servicio A:Gestión

- Responsabilidad: usuarios, identidad, roles, administracion de usuarios, contenidos públicos, temas visuales y contacto
- Base de datos: Postgre SQL
- Propietario exclusivo: datos de identidad, usuarios, roles y contenido de gestión


Servicio B: Catálogo e inventario

- Responsabilidad: productos, imágenes, precios publicados, existencias, reservas y movimientos de inventario
- Base de datos: MongoDB
- Propietario exclusivo: documentos de productos e inventario

Servicio C: Comercio

- Responsabilidad: carritos autenticados, órdenes, pagos de prueba, conciliación y notificaciones
- Base de datos: PostgreSQL
- Propietario exclusivo: carritos, órdenes, pagos y registro de notificación

Los tres servicios deben ejecutarse como procesos Django independientes y expóner sus propias API REST

Regla fundamental: ningún servicio puede consultar o modificar directamente las tablas o colecciones de otro servicio. La comunicación entre servicios se realiza mediante sus respectivas API.


2. Convenciones generales

Formato

- Todas las rutas comienzan con /api/.
- Los datos se intercambian en JSON.
- Los importes se expresan en pesos chilenos
- Las cantidades de productos son enteros positivos
- Los identificadores se tratan como cadenas en las respuestas públicas, aunque internamente utilicen UUID u ObjectId.
- Las fechas se expresan en ISO 8601, y cuando corresponda en UTC

Códigos HTTP

- 200 OK: operacion realizada correctamente
- 201 Created: recurso creado
- 204 No Content: operación correcta sin cuerpo de respuesta
- 400 Bad Request : Solicitud o datos inválidos
- 401 Unauthorized: autenticación inválida
- 403 Forbidden: usuario sin permisos suficientes
- 404 Not Found: recurso inexistente
- 409 Conflict: conflicto de estado, stock o duplicidad
- 429 Too Many Requests: límite de solcitudes alcanzado
- 500 Internal Server Error: error interno no controlado
No se deben devolver contraseñas, tokens internos ni trazas técnicas al cliente.


Autenticación y permisos

Como propuesta inicial, Gestión emitirá tokens de accesoi firmados después del inicino de sesión. D ebemos acordar el mecanismo exacto, su duración y cómo los validarán los otros servicios.

- Visitante: consuylta información pública y adminsitra su carrito en el frontend.
- Cliente activo: puede utilizar los endpoints administrativos autorizados.
- Administrador activo: puede utilizar los endpoints administrativos autorizados.
- Usuario bloqueado: no puede realizar operaciones que requieran una cuenta activa.

Todos los permisos se verifican en el backend.

3. Servicio A - Gestión

Base de datos: PostgreSQL

*3.1. Autenticación y cuentas*

- Registrar cuenta de un cliente
Método: POST
Endpoint: /api/auth/register/

- Iniciar sesión
Método: POST
Endpoint /api/auth/login/

- Cerrar sesión
Método: POST
Endpoint: /api/auth/logout

- Obtener el usuario + su rol
Método: GET
Endpoint: /api/auth/me/

- Renovar el token (si es que lo usamos)
Método: POST
Endpoint: /api/auth/refresh/

- Procesa un CSV UTF-8 (máximo 200 filas) con columnas
Método: POST
Endpoint: /api/v1/gestion/admin/usuarios/importar-masivo/







● Registro-POST /api/auth/register/
Entrada:

{
  "name": "Camila Pérez",
  "email": "camila@example.com",
  "password": "ContraseñaSegura123"
}

Respuesta esperada: 201 created, la confirmación de que se completó deberia verse así:
{
  "id": "user_123",
  "name": "Camila Pérez",
  "email": "camila@example.com",
  "role": "client",
  "status": "active"
}

Reglas:
- El registro solo puede crear clientes
- El backend valida los datos y almacena la contraseña mediante hash
- El correo debe cumplir la política de unicidad acordada.
- Nunca se devuelve la contraseña ni su hash
- La respuesta no debe permitirle al usuario que se asigne un rol administrativo


● Inicio de sesión - POST /api/auth/login/
Entrada:
{
  "email": "camila@example.com",
  "password": "ContraseñaSegura123"
}

Respuesta esperada:

{
  "access_token": "<token>",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "user_123",
    "name": "Camila Pérez",
    "role": "client",
    "status": "active"
  }
}

El token y su duración son una propuesta por validar. Las credencias incorrectas deben producir un error sin revelar si falló el correo o la contraseña. Además las cuentas bloquedas no deben poder operar como cuentas activas


● Cierre de sesión - POST /api/auth/logout/
Debe finalizar la sesión según el mecanismo elegido.

*3.2. Administración de usuarios*
Todos los endpoints de esta sección requieren un administrador activo

- Listar usuarios con paginación y filtros
Método: GET
Endpoint: /api/admin/users/

- Consultar un usuario
Método: GET
Endpoint: /api/admin/users/{user_id}/

- Modificar campos autorizados
Método: PATCH
Endpoint: /api/admin/users/{user_id}/

- Bloquear una cuenta
Método: POST
Endpoint: /api/admin/users/{user_id}/block/

- Desbloquear una cuenta
Método: POST
Endpoint: /api/admin/users/{user_id}/unblock/

Reglas:
● Un administrador no puede editar ni autobloquearse ni bloquear al último administrador activo con estas operaciones
● No se puede bloquear a un administrador activo
● La protección del último administrador debe funcionar cuando ocurren solicitudes simultáneas
● Solo los campos autorizados pueden modificarse
● La creación pública de cuentas nunca concede el rol de administrador 

*3.3.Contenido público*

- Listar páginas
Método: GET
Endpoint: /api/content/pages/

- Consultar una página por su slug
Método: GET
Endpoint: /api/content/pages/{slug}/

- Obtener banners publicados
Método: GET
Endpoint: /api/content/banners/

- Obtener secciones de la portada
Método: GET
Endpoint: /api/content/sections/


- Editar una página
Método: PATCH
Endpoint: /api/admin/content/pages/{page_id}/


- Crear un banner
Método: POST
Endpoint: /api/admin/content/banners/

- Editar un banner
Método: PATCH
Endpoint: /api/admin/content/banners/{banner_id}/

Las operaciones administrativas requieren de un administrador activo. El contenido no publicado no debe aparecer en consultas públicas.

*3.4.Temas visuales*

- Listar los temas disponibles
Método: GET
Endpoint: /api/themes/

- Consultar un tema predeterminado
Método: GET
Endpoint: /api/themes/active/

- Editar la configuración de un tema
Método: PATCH
Endpoints: /api/admin/themes/{theme_id}/

La tienda debe admitir los cuatro temas visuales requeridas por la evaluación. La selección personal del tema puede persistirse en React o en el perfil de usuario, según lo que acordemos como equipo. No confundir con el tema predeterminado global de la página


*3.5.Contacto*

- Enviar un mensaje de contacto
Método: POST
Endpoint: /api/contact/

- Consultar mensajes recibidos
Método: GET
Endpoint: /api/admin/contact-messages/

- Cambiar estado de atención
Método: PATCH
Endpoint: /api/admin/contact-messages/{message_id}/

El envío público debe validar los campos y contar con medidas razonables contra el abuso. Las consultas administrativas requieren permisos

4. Servicio B - Catálogo e inventario

Base de datos: MongoDB

*4.1.Consulta del catálogo*

- Listar productos publicados
Método: GET
Endpoint: /api/products/

- Consultar el detalle de un producto
Método: GET
Endpoint: /api/products/{product_id}/

- Listar categorías públicas+
Método: GET
Endpoint: /api/categories/

- Buscar productos
Método: GET
Endpoint: /api/products/search/

El listado puede admitir parámetros como page, page_size, category, search, sort y available. Un producto agotado puede mostrarse, pero no debe poder comprarse si no hay existencias disponibles. Los productos inactivos no deben aparecer en el catálogo de cara al público


*4.2.Administración de productos*

- Crear un producto
Método: POST
Endpoint: /api/products/

- Editar un producto
Método: PATCH
Endpoint: /api/products/{product_id}/

- Publicar un producto
Método: POST
Endpoint: /api/products/{product_id}/publish/

- Desactivar un producto
Método: POST
Endpoint: /api/products/{product_id}/deactivate/

- Consultar el catálogo administrativo
Método: GET
Endpoint: /api/admin/products/

Las operaciones administrativas requieren un administrador activo. En el sprint 02 debemos comprobar que un producto creado exista realmente en MongoDB


Creación de producto - POST /api/products/

Entrada:
{
  "name": "Mochila Urbana",
  "description": "Mochila para uso diario",
  "category_id": "cat_001",
  "price": 24990,
  "currency": "CLP",
  "images": [
    "https://example.com/mochila-1.jpg",
    "https://example.com/mochila-2.jpg",
    "https://example.com/mochila-3.jpg",
    "https://example.com/mochila-4.jpg"
  ],
  "initial_stock": 15,
  "status": "draft"
}

La respuesta esperada es: 201 Created:
{
  "id": "prod_001",
  "name": "Mochila Urbana",
  "price": 24990,
  "currency": "CLP",
  "stock": 15,
  "status": "draft"
}

Reglas:
● El precio debe ser un valor válido y positivo
● La moneda debe ser en CLP
● Las existencias deben ser enteros mayores o iguales a cero
● Cada producto publicado debe cumplir la cantidad y validez de imágenes exigidas, entre 4 y6 imágenes válidas
● La creación de un producto no debe permitir que un visitante o cliente se haga pasar por adminsitrador
● El equipo debe definir si la creación inicial permite productos en borrador y cómo se inicializa el inventario


*4.3.Inventario y reservas*

- Consultar disponibilidad
Método: GET
Endpoint /api/inventory/{product_id}/

- Ajustar existencias con autorización
Método: PATCH
Endpoint: /api/inventory/{product_id}/stock/

- Consultar movimientos
Método: GET
Endpoint: /api/inventory/movements/

- Solicitar una reserva de stock
Método: POST
Endpoint: /api/inventory/reservations/

- Consultar una reserva
Método: GET
Endpoint: /api/inventory/reservation/{reservation_id}

-  Confirmar la reserva según el flujo de compras
Método: POST
Endpoint: /api/inventory/reservations/{reservation_id}/confirm/

- Liberar una reserva
Método: POST
Endpoint: /api/inventory/reservations/{reservation_id}/release/

Las reservas deben tener identicador, estado y vencimiento definido. Su ciclo de vida y duración se acordaran entre el Catálogo/Inventario y Comercio

Reglas:
● Un carrito anónimo no reserva existencias
● Las existencias disponibles nunca pueden quedar negativas
● Dos compras concurrentes no pueden vender las mismas unidades
● Las operaciones repetidas deben controlarse para no descontar dos veces
● Cada ajuste de inventario debe dejar un movimiento trazable
● La liberación de una reserva no puede ejecutarse repetidamente de manera que aumente artificialmente el stock

5. Servicio C - Comercio
Base de datos: PostgreSQL, con esquema o base de datos separada y credenciales propias

-  Consultar el carrito autenticado
Método: GET
Endpoint: /api/cart/

- Agregar un producto
Método: POST
Endpoint: /api/cart/items/

-  Cambiar la cantidad
Método: PATCH
Endpoint: /api/cart/items/{item_id}/

- Quitar un producto
Método: DELETE
Endpoint: /api/cart/items/{item_id}/

-  Vaciar carrito
Método: DELETE
Endpoint: /api/cart/

- Fusionar el carrito temporal tras autenticarse
Método: POST
Endpoint: /api/cart/merge/

El carrito de comercio requiere una cuenta autenticada. El carrito anónimo puede mantenerse temporalmente en el frontend.

Al iniciar sesión o registrarse, React puede enviar el contenido temporal a /api/cart/merge/. El backend debe validar cadaproducto, cantidad y precio vigente. El carrito fusionado no debe reservar stock automáticamente. En caso de existir productos repetidos se suman en una misma linea y el backend notifica si algún producto sufrió cambios de precio o indisponibilidad de stock

*5.2.Checkout y órdenes*

- Iniciar el proceso de compra 
Método: POST
Endpoint: /api/checkout/

- Listar las órdenes del cliente autenticado
Método: GET
Endpoint: /api/orders/

-  Consultar una orden propia
Método: GET
Endpoint: /api/orders/{order_id}/

- Solicitar una cancelación si el estado lo permite
Método: POST
Endpoint: /api/orders/{order_id}/cancel/

- Consultar una orden para administación
Método: GET
Endpoint: /api/admin/orders/

- Consultar un detalle administrativo
Método: GET
Endpoint: /api/admin/orders/{order_id}/

Checkout - POST /api/checkout
Entrada:
{
  "items": [
    {
      "product_id": "prod_001",
      "quantity": 2
    }
  ],
  "payment_method": "sandbox",
  "idempotency_key": "checkout-unique-001"
}

El precio que envíe React, si lo envía, no es autoritativo. Comercio debe tener precios vigentes desde Catálogo/Inventario y calcular los totales en el backend.

Respuesta esperada:
{
  "order_id": "ord_001",
  "status": "pending_payment",
  "currency": "CLP",
  "total": 49980,
  "payment_status": "pending"
}

Reglas:
● Solo un cliente activo puede comprar.
● Se deben validor los productos, cantidades, precios y disponibilidad.
● La orden debe conservar una copia histórica del nombre, precio, moneda y cantidad de cada producto.
● La operación debe controlar compras simultáneas y evitar sobreventa mediante coordinación con Inventario
● La creación repetida de una misma operación no debe generar órdenes ni descuentos duplicados
● El estado de la orden debe ser coherente con el resultado del pago.

*5.3. Pagos de prueba*

- Iniciar un pago sandbox
Método: POST
Endpoint: /api/orders/{order_id}/payments/

- Consultar el estado de un pago
Método: GET
Endpoint: /api/payments/{payment_id}/

- Recibir eventos del proveedor simulado
Método: POST
Endpoint: /api/payments/webhook/

- Iniciar una conciliación autorizada
Método: POST
Endpoint: /api/admin/payments/reconcile/

- Consultar resultados de conciliación
Método: GET
Endpoint: /api/admin/payments/reconciliation/

El mecanismo definitivo dependerá del proveedor o simulador que se acuerde:

Reglas:
● No se procesan pagos reales.
● Los callbacks o webhooks deben validarse.
● Los eventos duplicados no pueden duplicar pagos ni modificar dos veces el stock.
● Los estados de pago y orden deben estar definidos y documentados.
● Un fallo de notificación por correo no debe revertir una compra confirmada


*5.4. Notificaciones*

- Consultar notificaciones del cliente 
Método: GET
Endpoint: /api/notificactions/

- Solicitar una notificación de compra
Método: POST
Endpoint: /api/internal/notifications/order-confirmed/

- Consultar notificaciones fallidas
Método: GET
Endpoint: /api/admin/notifications/failed/

- Reintentar una notificación
Método:POST
Endpoint: /api/admin/notifications/{notification_id}/retry/

Los endpoints internos no deben quedar expuestos sin autenticación y autorización. Los reintentos deben evitar notificaciones duplicadas y cuando sea posible.

6. Comunicación entre microservicios

Flujo de autenticación
a. React envía las credenciales a Gestión
b. Gestión autentica al usuario y entrega el mecanismo de sesión acordado
c. React utiliza ese mecanismo al consultar los servicios protegidos
d. Cada servicio valida la identidad y los permisos de forma segura


Flujo de compra

a. React envía el checkout a Comercio
b. Comercio valida que el usuario esté autorizado
c. Comercio solicita a Catálogo/Inventario los precios y la disponibilidad vigentes
d. Catálogo/Inventario coordina la reserva de las unidades para evitar sobreventa
e. Comercio registra la orden y procesa el pago sandbox según el flujo acordado.
f. Catálogo/Inventario confirma el descuento definitivo o libera la reserva según el resultado
g. Comercio actualiza los estados de la orden y el pago
h. Se solicita la noticación de compra sin hacer depender la confirmación de la orden del éxito del correo.

************ DEBEMOS DEFINIR QUÉ OCURRE SI UN SERVICIO FALLA A LA MITAD DEL PROCESO. NO EXISTE UNA TRANSACCIÓN SQL QUE ABARQUE AUTOMÁTICAMENTE POSTGRESQL Y MONGODB ***************

Operaciones Críticas / Idempotencia

Para operaciones críticas, como checkout, pagos y confirmación de reservas, se utilizará una clave de idempotencia o identificador único de evento.
Repetir la misma operación no debe producir una segunda orden, un segundo pago, ni un nuevo descuento de stock.


7. Seguridad y pruebas de aceptación
Como mínimo, debemos probar los siguientes casos:

a. Visitante intenta crear un producto: código 401 o 403

b. Cliente intenta acceder a una ruta administrativa: Código 403

c. Registro intenta asignar el rol de administrador: Se rechaza la solicitud

d. Usuario bloquado intenta comprar: Se rechaza

e. Producto con precio cero o negativo: Se rechaza

f. Cantidad de producto cero, negativa o decimal: se rechaza

g. Producto publicado con imágenes insuficientes: Se rechaza

h. Compra con stock insuficiente: Se rechaza sin sobreventa

i. Dos compras simultáneas compiten por las últimas unidades: Solo se confirma lo que permita el stock

j. Se repite un evento de pago: NO se duplica la operación

k. Falla el correo después de confirmar la compra: La compra permanece confirmada

l. Administrador intenta bloquearse a sí mismo: Se rechaza

m. Se intenta bloquear al último administrador activo: Se rechaza, incluso con solicitudes concurrentes

8. Estándares de Arquitectura y reglas del sistema

*8.1.Estructura de arquitectura y Reglas del sistems*

Nombre de los microservicios:
'gestion-service' : Autenticación, usuarios, contenidos, temas, contacto [PostgreSQL]
'catalogo-service' : Productos, imágenes, inventario, reservas [MongoDB]
'comercio-service' : Carrito, órdenes, pagos sandbox, conciliación [PostgreSQL]

