from django.contrib import admin
from .models import NotificacionCorreo
from .services import _enviar_individual_seguro

@admin.register(NotificacionCorreo)
class NotificacionCorreoAdmin(admin.ModelAdmin):
    list_display = ('id', 'orden_referencia', 'tipo_destinatario', 'destinatario', 'estado', 'intentos', 'updated_at')
    list_filter =('estado', 'tipo_destinatario', 'created_at')
    search_fields =('orden_referencia', 'destinatario' , 'asunto')
    readonly_fields = ('created_at', 'updated_at', 'intentos', 'mensaje_error')
    actions = ['reintentar_envio_fallidos']
    
    @admin.action(description="Reintentar envio de correos seleccionados (FALLIDOS o PENDIENTES)")
    def reintentar_envio_fallidos (self,request,queryset):
        exitosos = 0 
        fallidos = 0 
        for notificacion in queryset.exclude(estado='ENVIADO'):
            if _enviar_individual_seguro(notificacion):
                exitosos += 1
            else : 
                fallidos += 1 
        self.message_user(
            request, f"Reintento finalizado: {exitosos} enviados correctamente, {fallidos} siguen fallando."
        )
