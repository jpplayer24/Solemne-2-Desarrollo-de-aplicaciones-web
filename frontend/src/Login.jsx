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
            if (data.refresh) {
                localStorage.setItem('refreshToken', data.refresh);
            }

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
                // Modo simulación local para pruebas de interfaz
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
                setEstado('Error al procesar la solicitud. Intente nuevamente.');
            }
        } finally {
            setCargando(false);
        }
    };

    // Estilos claros y visibles para los recuadros de entrada
    const inputStyle = {
        width: '100%',
        boxSizing: 'border-box',
        padding: '0.75rem 0.9rem',
        fontSize: '0.95rem',
        color: '#1f2937',
        backgroundColor: '#ffffff',
        border: '1.5px solid #d1d5db',
        borderRadius: '6px',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        display: 'block'
    };

    return (
        <div style={{
            maxWidth: '380px',
            margin: '2.5rem auto',
            padding: '2.2rem 2rem',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <h2 style={{
                textAlign: 'center',
                margin: '0 0 1.8rem 0',
                color: '#1f2937',
                fontSize: '1.4rem',
                fontWeight: '700'
            }}>
                Acceso al Sistema
            </h2>

            <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {/* Campo Correo Electrónico */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left' }}>
                    <label htmlFor="email" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151' }}>
                        Correo Electrónico
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="ejemplo@correo.cl"
                        value={credenciales.email}
                        onChange={manejarCambio}
                        required
                        style={inputStyle}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#9333ea';
                            e.target.style.boxShadow = '0 0 0 3px rgba(147, 51, 234, 0.15)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#d1d5db';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                </div>

                {/* Campo Contraseña */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left' }}>
                    <label htmlFor="password" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151' }}>
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
                        onFocus={(e) => {
                            e.target.style.borderColor = '#9333ea';
                            e.target.style.boxShadow = '0 0 0 3px rgba(147, 51, 234, 0.15)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#d1d5db';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                </div>

                {/* Botón de Envío */}
                <button
                    type="submit"
                    disabled={cargando}
                    style={{
                        marginTop: '0.6rem',
                        padding: '0.8rem',
                        backgroundColor: '#9333ea',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        cursor: cargando ? 'not-allowed' : 'pointer',
                        opacity: cargando ? 0.7 : 1,
                        transition: 'background-color 0.2s'
                    }}
                >
                    {cargando ? 'Autenticando...' : 'Iniciar Sesión'}
                </button>
            </form>

            {/* Mensaje de error o estado */}
            {estado && (
                <div style={{
                    marginTop: '1.2rem',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #fecaca',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    textAlign: 'center'
                }}>
                    {estado}
                </div>
            )}
        </div>
    );
}