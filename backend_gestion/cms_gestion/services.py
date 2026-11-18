from django.core.mail import send_mail
from django.conf import settings
from .models import NotificacionCorreo

def _enviar_individual_seguro (notificacion: NotificacionCorreo) -> bool: 
    """
    Envía un correo electrónico individual de manera segura.
    Retorna True si el correo fue enviado exitosamente, False en caso contrario.
    """
    try: 
        send_mail(
            subject=notificacion.asunto,
            message=notificacion.contenido,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[notificacion.destinatario],
            fail_silently=False,
        )
        notificacion.estado = 'enviado'
        notificacion.intentos += 1
        notificacion.mensaje_error = ''
        notificacion.save()
        return True
    except Exception as e:
        notificacion.estado = 'fallido'
        notificacion.intentos += 1
        notificacion.mensaje_error = str(e)
        notificacion.save()
        return False
    
def noti_compras (orden_id, nombre_cliente,email_cliente,items_mochila,total_compra,email_admin="admin@dreamhub.com"):
    """
    
    Se encarga de generar y enviar 2 correos con la informacion de la mochilas compradas, uno al cliente y otro al administrador.
    si llega a fallar el envio de los correos, se registra el fallo en la BD para reintento y no lanza errores al usuario.
    
    """
    lineas_items = "\n".join(
        [
            f"- {item['nombre']} | Cantidad: {item['cantidad']} | Subtotal: ${item.get('subtotal', item.get('precio', 0))}"
            for item in items_mochila
        ]
    )
    
    #CONTENIDO DE LOS CORREOS 
    cuerpo_cliente= (
        f"Hola {nombre_cliente},\n\n"
        f"Gracias por realizar tu compra #{orden_id} en Dreamhub. Tu pedido fue confirmado con exito. \n\n"
        f"Desglose del pedido: \n"
        f"{lineas_items} \n\n"
        f"Total pagado: ${total_compra}\n\n"
        f"Gracias por preferir Dreamhub."
    )
    
    cuerpo_admin = (
        f"Nueva compra registrada en Dreamhub (Orden #{orden_id}. \n)"
        f"Cliente: {nombre_cliente} ; Correo: {email_cliente} \n\n"
        f"Desglose del pedido para despacho: \n"
        f"{lineas_items}\n\n"
        f"Total de la orden: ${total_compra}"
    )
    
    #NOTIFICACION DE LOS CORREOS 
    noti_cliente = NotificacionCorreo.objects.create(
        orden_referencia = str(orden_id),
        tipo_destinatario= 'CLIENTE',
        destinatario= email_cliente,
        asunto= f"Confirmacion de la compra #{orden_id} | Dreamhub",
        contenido= cuerpo_cliente,
    )
    
    noti_admin = NotificacionCorreo.objects.create(
        orden_referencia = str(orden_id),
        tipo_destinatario = 'ADMIN',
        destinatario = email_admin,
        asunto = f"Nueva orden #{orden_id} | Dreamhub",
        contenido =cuerpo_admin,
    )
    
    #ENVIAR LOS CORREOS 
    
    enviado_cliente = _enviar_individual_seguro(noti_cliente)
    enviado_admin = _enviar_individual_seguro(noti_admin)
    
    return {
        "correo_cliente": {"id":noti_cliente.id, "estado":noti_cliente.estado},
        "correo_admin": {"id":noti_admin.id, "estado": noti_admin.estado},
        "ambos_enviados" : enviado_cliente and enviado_admin,
    }