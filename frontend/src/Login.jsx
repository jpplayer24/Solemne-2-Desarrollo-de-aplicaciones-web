import { useState } from 'react';

export default function Login() {
    const [credenciales, setCredenciales] = useState({ email: '', password: '' });
    const [estado, setEstado] = useState(null);

    const manejarCambio = (e) => {
        const { name, value } = e.target;
        setCredenciales({ ...credenciales, [name]: value });
    };

    const simularEnvio = (e) => {
        e.preventDefault();
        setEstado('Autenticando...');
        
        setTimeout(() => {
            if (credenciales.email === 'admin@dreamhub.cl' && credenciales.password === 'admin123') {
                setEstado('Acceso concedido. Trabajo en Proceso');
            } else {
                setEstado('Error: Endpoints de DRF desconectados. Credenciales rechazadas.');
            }
        }, 1500);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '350px', margin: '2rem auto', border: '1px solid var(--text)', borderRadius: '8px', backgroundColor: 'var(--bg)', color: 'var(--text)', fontFamily: 'sans-serif' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Acceso al Sistema</h2>
            <form onSubmit={simularEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="email" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Correo Electrónico</label>
                    <input type="email" id="email" name="email" value={credenciales.email} onChange={manejarCambio} required style={{ padding: '0.6rem', background: 'transparent', color: 'var(--text)', border: '1px solid var(--text)', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="password" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Contraseña</label>
                    <input type="password" id="password" name="password" value={credenciales.password} onChange={manejarCambio} required style={{ padding: '0.6rem', background: 'transparent', color: 'var(--text)', border: '1px solid var(--text)', borderRadius: '4px' }} />
                </div>
                <button type="submit" style={{ padding: '0.8rem', background: 'var(--text)', color: 'var(--bg)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '0.5rem' }}>Iniciar Sesión</button>
            </form>
            {estado && <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px dashed var(--text)', fontSize: '0.85rem', textAlign: 'center' }}>{estado}</div>}
        </div>
    );
}
