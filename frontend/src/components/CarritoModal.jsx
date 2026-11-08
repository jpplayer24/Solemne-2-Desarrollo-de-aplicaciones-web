// ============================================================================
// Componente: CarritoModal.jsx
// Visualización del carrito de compras, cálculo de subtotales y aviso de fusión (RB-01, RB-02)
// ============================================================================

import { Link, useNavigate } from 'react-router-dom';

export default function CarritoModal({ items, onUpdateQuantity, onRemoveItem, onClose, notification }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Cálculo exacto del importe total (acumulado en CLP)
  const totalImporte = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  const handleProcederAlPago = () => {
    onClose();
    if (!token) {
      // RB-01: Redirigir obligatoriamente al login reteniendo la intención de compra
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-main)',
        borderRadius: 'var(--radius-lg)',
        width: '90%',
        maxWidth: '550px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden'
      }}>
        {/* Encabezado Modal */}
        <div style={{
          padding: '1.2rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>
            🎒 Carrito de Mochilas ({items.length})
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.4rem',
              cursor: 'pointer'
            }}
          >
            &times;
          </button>
        </div>

        {/* Notificación en caso de ajuste de stock o combinación post-login */}
        {notification && (
          <div style={{
            margin: '1rem 1.5rem 0 1.5rem',
            padding: '0.8rem 1rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--badge-bg)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--badge-text)',
            fontSize: '0.88rem'
          }}>
            ℹ️ {notification}
          </div>
        )}

        {/* Listado de items en el carrito */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
              <p>Tu carrito anónimo está vacío.</p>
              <Link to="/catalogo" onClick={onClose} className="btn-primary" style={{ marginTop: '0.5rem' }}>
                Explorar Mochilas
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.8rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {item.nombre}
                    </h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '700' }}>
                      ${item.precio.toLocaleString('es-CL')} CLP
                    </span>
                  </div>

                  {/* Selector de Cantidad */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.cantidad - 1)}
                      className="btn-secondary"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', width: '20px', textAlign: 'center' }}>
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}
                      className="btn-secondary"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                    >
                      +
                    </button>
                  </div>

                  {/* Botón Eliminar */}
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      marginLeft: '0.4rem'
                    }}
                    title="Eliminar producto"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie de Modal y Total */}
        {items.length > 0 && (
          <div style={{
            padding: '1.2rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Total Estimado:</span>
              <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>
                ${totalImporte.toLocaleString('es-CL')} CLP
              </span>
            </div>
            <button
              onClick={handleProcederAlPago}
              className="btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
            >
              {token ? 'Proceder al Pago' : 'Iniciar Sesión para Pagar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}