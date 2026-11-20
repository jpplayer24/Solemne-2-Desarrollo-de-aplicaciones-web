import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function ConfirmacionOrden() {
  const { ordenId } = useParams();
  const [orden, setOrden] = useState(null);
  const [accesoDenegado, setAccesoDenegado] = useState(false);
  const [cargando, setCargando] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    // Consulta al endpoint protegido de Django REST Framework
    axios
      .get(`http://localhost:8000/api/comercio/ordenes/${ordenId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setOrden(res.data);
        setCargando(false);
      })
      .catch((err) => {
        // Si Django bloquea con 403 Forbidden o 404 Not Found
        if (err.response && (err.response.status === 403 || err.response.status === 404)) {
          setAccesoDenegado(true);
          setCargando(false);
          return;
        }

        // Validación en modo local (Cliente A vs Cliente B)
        const ordenesGuardadas = JSON.parse(localStorage.getItem('dreamhub_ordenes') || '{}');
        const ordenEncontrada = ordenesGuardadas[ordenId];

        if (!ordenEncontrada) {
          setAccesoDenegado(true);
        } else {
          const usuarioActual =
            token === 'simulated_admin_jwt_token'
              ? 'admin@dreamhub.cl'
              : token === 'simulated_client_jwt_token'
              ? 'cliente@dreamhub.cl'
              : 'cliente_b@dreamhub.cl';

          if (ordenEncontrada.propietario_email !== usuarioActual && token !== 'simulated_admin_jwt_token') {
            setAccesoDenegado(true);
          } else {
            setOrden(ordenEncontrada);
          }
        }
        setCargando(false);
      });
  }, [ordenId, token]);

  if (cargando) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Verificando propiedad de la orden...</div>;
  }

  if (accesoDenegado) {
    return (
      <div style={{ maxWidth: '550px', margin: '4rem auto', padding: '2.5rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1.5px solid #ef4444' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>🔒</div>
        <h2 style={{ color: '#ef4444', margin: '0 0 0.8rem 0' }}>Acceso Denegado (Error 403)</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          No tienes permisos para visualizar la orden <strong>{ordenId}</strong>. Este comprobante pertenece a otro cliente registrado en DreamHUB.
        </p>
        <Link to="/catalogo" className="btn-primary">
          Volver a la Tienda
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '3rem auto', padding: '2.5rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
        <h1 style={{ margin: '0 0 0.4rem 0', color: 'var(--primary)' }}>¡Compra Confirmada!</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          Orden N° <strong>{orden.id}</strong> • Fecha: {orden.fecha}
        </p>
      </div>

      <div style={{ padding: '1.2rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.92rem' }}>
        <p style={{ margin: '0 0 0.4rem 0' }}>
          <strong>Titular de la compra:</strong> {orden.propietario_email || 'Cliente Verificado'}
        </p>
        <p style={{ margin: '0 0 0.4rem 0' }}>
          <strong>Dirección de despacho:</strong> {orden.direccion_envio}
        </p>
        <p style={{ margin: 0 }}>
          <strong>Estado:</strong> <span style={{ color: '#10b981', fontWeight: '700' }}>{orden.estado}</span>
        </p>
      </div>

      <h3>Detalle de Mochilas Adquiridas</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
        {orden.items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <span>
              {item.cantidad}x {item.nombre}
            </span>
            <strong>${(item.precio * item.cantidad).toLocaleString('es-CL')} CLP</strong>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: '800', marginBottom: '2rem' }}>
        <span>Total Pagado:</span>
        <span style={{ color: 'var(--primary)' }}>${orden.total.toLocaleString('es-CL')} CLP</span>
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link to="/catalogo" className="btn-primary">
          Seguir Explorando Mochilas
        </Link>
      </div>
    </div>
  );
}