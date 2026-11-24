// ============================================================================
// Componente: GestionUsuarios
// Implementa bloqueo y desbloqueo de usuarios con protección RF-14 y RB-06:
// - Impide el autobloqueo del administrador en sesión
// - Impide bloquear al último administrador activo del sistema
// ============================================================================
import { useState, useEffect } from 'react';
import axios from 'axios';

// Lista inicial de usuarios del sistema para demostración y respaldo local
const USUARIOS_INICIALES = [
  { id: 1, nombre: 'Administrador Principal', email: 'admin@dreamhub.cl', rol: 'ADMIN', bloqueado: false },
  { id: 2, nombre: 'Administrador Soporte', email: 'admin2@dreamhub.cl', rol: 'ADMIN', bloqueado: false },
  { id: 3, nombre: 'Cliente A (Camila)', email: 'cliente@dreamhub.cl', rol: 'CLIENTE', bloqueado: false },
  { id: 4, nombre: 'Cliente B (Prueba IDOR)', email: 'clienteb@dreamhub.cl', rol: 'CLIENTE', bloqueado: false }
];

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Obtenemos el correo del administrador que tiene la sesión iniciada
  const emailAdminActual = (localStorage.getItem('user_email') || 'admin@dreamhub.cl').toLowerCase();

  useEffect(() => {
    // Intentamos obtener la lista real desde Django; si no responde, usamos localStorage
    axios
      .get('http://localhost:8000/api/usuarios/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      .then((res) => setUsuarios(res.data))
      .catch(() => {
        const guardados = JSON.parse(localStorage.getItem('dreamhub_usuarios') || 'null');
        if (guardados && guardados.length > 0) {
          setUsuarios(guardados);
        } else {
          localStorage.setItem('dreamhub_usuarios', JSON.stringify(USUARIOS_INICIALES));
          setUsuarios(USUARIOS_INICIALES);
        }
      });
  }, []);

  // Contamos cuántos administradores activos (no bloqueados) existen actualmente
  const adminsActivos = usuarios.filter((u) => u.rol === 'ADMIN' && !u.bloqueado).length;

  const alternarBloqueoUsuario = async (usuarioObjetivo) => {
    setMensaje({ tipo: '', texto: '' });

    // Regla 1 (RB-06): Impedir autobloqueo del administrador actual
    if (usuarioObjetivo.email.toLowerCase() === emailAdminActual) {
      setMensaje({
        tipo: 'error',
        texto: 'Operación rechazada (RB-06): Un administrador no puede bloquear su propia cuenta.'
      });
      return;
    }

    // Regla 2 (RF-14 / RB-06): Impedir bloquear al último administrador activo
    if (usuarioObjetivo.rol === 'ADMIN' && !usuarioObjetivo.bloqueado && adminsActivos <= 1) {
      setMensaje({
        tipo: 'error',
        texto: 'Operación rechazada (RF-14): No se puede bloquear al último administrador activo del sistema.'
      });
      return;
    }

    const nuevoEstadoBloqueo = !usuarioObjetivo.bloqueado;

    try {
      // Llamada al endpoint real en Django REST Framework
      await axios.patch(
        `http://localhost:8000/api/usuarios/${usuarioObjetivo.id}/bloqueo/`,
        { bloqueado: nuevoEstadoBloqueo },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
    } catch (err) {
      // Si el backend devuelve un rechazo de seguridad (400/403), mostramos su mensaje
      if (err.response && err.response.data?.detail) {
        setMensaje({ tipo: 'error', texto: err.response.data.detail });
        return;
      }
    }

    // Actualizamos el estado en pantalla y en localStorage
    const listaActualizada = usuarios.map((u) =>
      u.id === usuarioObjetivo.id ? { ...u, bloqueado: nuevoEstadoBloqueo } : u
    );

    setUsuarios(listaActualizada);
    localStorage.setItem('dreamhub_usuarios', JSON.stringify(listaActualizada));

    setMensaje({
      tipo: 'exito',
      texto: `Usuario ${usuarioObjetivo.email} ${nuevoEstadoBloqueo ? 'bloqueado' : 'desbloqueado'} correctamente.`
    });
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)'
      }}
    >
      <div style={{ marginBottom: '1.2rem' }}>
        <h2 style={{ margin: '0 0 0.3rem 0', fontSize: '1.2rem' }}>
          Control de Acceso y Bloqueo de Usuarios (RF-14)
        </h2>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Administradores activos en el sistema: <strong>{adminsActivos}</strong> (Mínimo requerido: 1)
        </p>
      </div>

      {/* Mensaje de alerta o confirmación accesible */}
      {mensaje.texto && (
        <div
          role={mensaje.tipo === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          style={{
            padding: '0.85rem 1rem',
            marginBottom: '1.2rem',
            borderRadius: 'var(--radius-sm)',
            fontWeight: '600',
            fontSize: '0.9rem',
            backgroundColor: mensaje.tipo === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            color: mensaje.tipo === 'error' ? '#dc2626' : '#059669',
            border: `1px solid ${mensaje.tipo === 'error' ? '#dc2626' : '#059669'}`
          }}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Listado responsivo de usuarios */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {usuarios.map((u) => {
          const esMismoAdmin = u.email.toLowerCase() === emailAdminActual;
          const esUltimoAdminActivo = u.rol === 'ADMIN' && !u.bloqueado && adminsActivos <= 1;
          const bloqueoProhibido = esMismoAdmin || esUltimoAdminActivo;

          return (
            <div
              key={u.id}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-body)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <strong>{u.nombre}</strong>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      padding: '0.15rem 0.55rem',
                      borderRadius: '12px',
                      backgroundColor: u.rol === 'ADMIN' ? 'rgba(217, 119, 6, 0.15)' : 'var(--badge-bg)',
                      color: 'var(--primary)'
                    }}
                  >
                    {u.rol}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: u.bloqueado ? '#dc2626' : '#059669'
                    }}
                  >
                    {u.bloqueado ? 'BLOQUEADO' : 'ACTIVO'}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {u.email} {esMismoAdmin ? '(Tu sesión actual)' : ''}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => alternarBloqueoUsuario(u)}
                  disabled={bloqueoProhibido}
                  aria-label={`${u.bloqueado ? 'Desbloquear' : 'Bloquear'} cuenta de ${u.email}`}
                  className={u.bloqueado ? 'btn-primary' : 'btn-secondary'}
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.45rem 0.9rem',
                    opacity: bloqueoProhibido ? 0.5 : 1,
                    cursor: bloqueoProhibido ? 'not-allowed' : 'pointer'
                  }}
                  title={
                    esMismoAdmin
                      ? 'No puedes bloquear tu propia cuenta (RB-06)'
                      : esUltimoAdminActivo
                      ? 'Protección del último administrador activo (RF-14)'
                      : ''
                  }
                >
                  {u.bloqueado ? 'Desbloquear Usuario' : 'Bloquear Usuario'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}