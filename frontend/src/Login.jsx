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
            // Llamada al endpoint de login en Django REST Framework
            const respuesta = await axios.post('http://localhost:8000/api/auth/login/', credenciales);
            const data = respuesta.data;

            // Persistencia de tokens y rol
            localStorage.setItem('token', data.access);
            if (data.refresh) {
                localStorage.setItem('refreshToken', data.refresh);
            }

            const rol = (data.user?.rol || data.user?.role || data.rol || data.role || 'CLIENTE').toUpperCase();
            localStorage.setItem('role', rol);

            // RF-08: Redirección según rol
            if (rol === 'ADMIN') {
                navigate('/admin', { replace: true });
            } else {
                // Si venía del carrito o checkout, retorna a la ruta previa (RB-02); si no, al catálogo
                const rutaOrigen = location.state?.from?.pathname || '/';
                navigate(rutaOrigen, { replace: true });
            }
        } catch (error) {
            // Manejo de contingencia y simulación local mientras el backend no esté encendido
            if (!error.response) {
                // Modo fallback para pruebas locales de interfaz
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
                // RF-08: Rechazo sin exponer estructuras internas
                setEstado(error.response.data?.detail || 'Credenciales inválidas o cuenta inactiva.');
            } else if (error.response.status === 403) {
                setEstado('Cuenta bloqueada. Comuníquese con administración.');
            } else {
                setEstado('Error al procesar la solicitud. Intente nuevamente.');
            }
        } finally {
            setCargando(false);
        }
    };

    return (
        <div style={{
            padding: '2rem',
            maxWidth: '380px',
            margin: '3rem auto',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                Acceso al Sistema
            </h2>
            <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="email" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                        Correo Electrónico
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={credenciales.email}
                        onChange={manejarCambio}
                        required
                        style={{
                            padding: '0.6rem',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="password" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                        Contraseña
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={credenciales.password}
                        onChange={manejarCambio}
                        required
                        style={{
                            padding: '0.6rem',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px'
                        }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={cargando}
                    className="btn-primary"
                    style={{ marginTop: '0.5rem', padding: '0.8rem' }}
                >
                    {cargando ? 'Autenticando...' : 'Iniciar Sesión'}
                </button>
            </form>

            {estado && (
                <div style={{
                    marginTop: '1.5rem',
                    padding: '0.8rem',
                    borderRadius: '4px',
                    border: '1px solid #ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    textAlign: 'center'
                }}>
                    {estado}
                </div>
            )}
        </div>
    );
}