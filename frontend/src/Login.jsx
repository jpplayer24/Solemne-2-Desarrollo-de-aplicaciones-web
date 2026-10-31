import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [credenciales, setCredenciales] = useState({ email: '', password: '' });
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setCredenciales({ ...credenciales, [name]: value });
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setEstado(null);
    setCargando(true);

    try {
      const respuesta = await axios.post('http://localhost:8000/api/auth/login/', credenciales);
      const data = respuesta.data;

      localStorage.setItem('token', data.access);
      if (data.refresh) localStorage.setItem('refreshToken', data.refresh);

      const rol = (data.user?.rol || data.user?.role || data.rol || data.role || 'CLIENTE').toUpperCase();
      localStorage.setItem('role', rol);

      if (rol === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        const rutaOrigen = location.state?.from?.pathname || '/';
        navigate(rutaOrigen, { replace: true });
      }
    } catch (error) {
      if (!error.response) {
        if (credenciales.email === 'admin@dreamhub.cl' && credenciales.password === 'admin123') {
          localStorage.setItem('token', 'simulated_admin_jwt_token');
          localStorage.setItem('role', 'ADMIN');
          navigate('/admin', { replace: true });
          return;
        }
        if (credenciales.email === 'cliente@dreamhub.cl' && credenciales.password === 'cliente123') {
          localStorage.setItem('token', 'simulated_client_jwt_token');
          localStorage.setItem('role', 'CLIENTE');
          const rutaOrigen = location.state?.from?.pathname || '/';
          navigate(rutaOrigen, { replace: true });
          return;
        }
        setEstado('Error: No se pudo conectar con el servidor backend (DRF).');
      } else if (error.response.status === 401 || error.response.status === 400) {
        setEstado(error.response.data?.detail || 'Credenciales inválidas o cuenta inactiva.');
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
            Correo Electrónico
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="usuario@ejemplo.cl"
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
            placeholder="••••••••"
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

      {estado && (
        <div style={{
          marginTop: '1.5rem',
          padding: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#ef4444',
          fontSize: '0.85rem',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          {estado}
        </div>
      )}
    </div>
  );
}