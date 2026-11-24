// ============================================================================
// Maneja la autenticación de clientes y administradores con conexión a Django
// y respaldo local (cuentas de prueba y validación de usuarios bloqueados)
// ============================================================================
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [credenciales, setCredenciales] = useState({ email: '', password: '' });
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Actualiza el estado cada vez que el usuario escribe en los campos
  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setCredenciales({ ...credenciales, [name]: value });
  };

  // Procesa el envío del formulario de inicio de sesión
  const manejarEnvio = async (e) => {
    e.preventDefault();
    setEstado(null);
    setCargando(true);

    const correoIngresado = credenciales.email.trim().toLowerCase();

    // Revisamos si la cuenta fue bloqueada previamente desde el Panel de Administración (RF-08 / RB-06)
    const usuariosGuardados = JSON.parse(localStorage.getItem('dreamhub_usuarios') || '[]');
    const usuarioRegistrado = usuariosGuardados.find(
      (u) => u.email.toLowerCase() === correoIngresado
    );

    if (usuarioRegistrado && usuarioRegistrado.bloqueado) {
      setEstado('Cuenta bloqueada. Comuníquese con administración.');
      setCargando(false);
      return;
    }

    try {
      // Intento de autenticación real contra el servidor Django REST Framework
      const respuesta = await axios.post('/api/auth/login/', {
        username: credenciales.email,
        password: credenciales.password,
      });

      const data = respuesta.data;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_email', correoIngresado);

      const rol = data.is_staff ? 'ADMIN' : 'CLIENTE';
      localStorage.setItem('role', rol);

      // Si es administrador va directo a /admin; si es cliente vuelve a la página de origen
      const rutaOrigen = location.state?.from?.pathname || '/';
      const destino = rol === 'ADMIN' ? '/admin' : rutaOrigen;
      navigate(destino, { replace: true });

    }  catch (error) {
      // Si el servidor backend no responde o Vite devuelve 404/502 porque Django no está encendido,
      // usamos las cuentas de prueba locales para poder navegar y probar los roles
      if (!error.response || error.response.status === 404 || error.response.status >= 500) {
        if (correoIngresado === 'admin@dreamhub.cl' && credenciales.password === 'admin123') {
          localStorage.setItem('token', 'simulated_admin_jwt_token');
          localStorage.setItem('role', 'ADMIN');
          localStorage.setItem('user_email', 'admin@dreamhub.cl');
          navigate('/admin', { replace: true });
          return;
        }

        if (correoIngresado === 'cliente@dreamhub.cl' && credenciales.password === 'cliente123') {
          localStorage.setItem('token', 'simulated_client_jwt_token');
          localStorage.setItem('role', 'CLIENTE');
          localStorage.setItem('user_email', 'cliente@dreamhub.cl');
          const rutaOrigen = location.state?.from?.pathname || '/';
          navigate(rutaOrigen, { replace: true });
          return;
        }

        if (correoIngresado === 'clienteb@dreamhub.cl' && credenciales.password === 'cliente123') {
          localStorage.setItem('token', 'simulated_client_b_jwt_token');
          localStorage.setItem('role', 'CLIENTE');
          localStorage.setItem('user_email', 'clienteb@dreamhub.cl');
          const rutaOrigen = location.state?.from?.pathname || '/';
          navigate(rutaOrigen, { replace: true });
          return;
        }

        setEstado('Error: No se pudo conectar con el servidor backend (DRF) o credenciales incorrectas.');
      } else if (error.response.status === 401 || error.response.status === 400) {
        setEstado(error.response.data?.error || 'Credenciales inválidas o cuenta inactiva.');
      } else if (error.response.status === 403) {
        setEstado('Cuenta bloqueada. Comuníquese con administración.');
      } else {
        setEstado('Error al procesar la solicitud.');
      }
    } finally {
      setCargando(false);
    }
  };

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '0.8rem 1rem',
    fontSize: '0.92rem',
    color: 'var(--text-main)',
    backgroundColor: 'var(--bg-body)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    outline: 'none',
    transition: 'var(--transition)'
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '4rem auto',
      padding: '2.5rem 2.2rem',
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 0.4rem 0', color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: '800' }}>
          Bienvenido a Dream<span style={{ color: 'var(--primary)' }}>HUB</span>
        </h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Ingresa tus credenciales para continuar
        </p>
      </div>

      <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="email" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
            Nombre de Usuario o Correo
          </label>
          <input
            type="text"
            id="email"
            name="email"
            placeholder="Ingresa tu usuario o correo"
            value={credenciales.email}
            onChange={manejarCambio}
            required
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="password" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
            Contraseña
          </label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="********"
            value={credenciales.password}
            onChange={manejarCambio}
            required
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="btn-primary"
          style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}
        >
          {cargando ? 'Verificando...' : 'Iniciar Sesión'}
        </button>
      </form>

      {/* Mensaje de error accesible para lectores de pantalla */}
      {estado && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            marginTop: '1.5rem',
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#ef4444',
            fontSize: '0.85rem',
            textAlign: 'center',
            fontWeight: '500'
          }}
        >
          {estado}
        </div>
      )}
    </div>
  );
}