import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Login from './Login';
import ProtectedRoute from './components/ProtectedRoute';
import ProductDetail from './components/ProductDetail';
import Inicio from './components/Inicio';
import QuienesSomos from './components/QuienesSomos';
import CarritoModal from './components/CarritoModal';
import { useCart } from './hooks/useCart';

function BarraNavegacion({ onOpenCarrito, cantidadTotal }) {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const rol = (localStorage.getItem('role') || 'VISITANTE').toUpperCase();

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const navLinkStyle = (path) => ({
    textDecoration: 'none',
    fontSize: '0.92rem',
    fontWeight: location.pathname === path ? '700' : '500',
    color: location.pathname === path ? 'var(--primary)' : 'var(--text-main)',
    padding: '0.4rem 0.8rem',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: location.pathname === path ? 'var(--badge-bg)' : 'transparent',
  });

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.75rem 2.2rem',
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'var(--text-main)' }}>
          <img src="/logo.png" alt="Logo DreamHUB" style={{ height: '38px', width: 'auto', display: 'block' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: '800' }}>
            Dream<span style={{ color: 'var(--primary)' }}>HUB</span>
          </span>
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to="/" style={navLinkStyle('/')}>Inicio</Link>
          <Link to="/catalogo" style={navLinkStyle('/catalogo')}>Catálogo</Link>
          <Link to="/quienes-somos" style={navLinkStyle('/quienes-somos')}>Quiénes Somos</Link>

          {rol === 'ADMIN' && (
            <Link to="/admin" style={{ textDecoration: 'none', fontSize: '0.85rem', fontWeight: '700', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.35rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
              🛡️ Panel Admin
            </Link>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {/* BOTÓN DEL CARRITO CON CONTADOR */}
        <button
          onClick={onOpenCarrito}
          className="btn-secondary"
          style={{ position: 'relative', padding: '0.55rem 1rem' }}
        >
          🎒 Carrito
          {cantidadTotal > 0 && (
            <span style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              borderRadius: '50%',
              padding: '0.15rem 0.45rem',
              fontSize: '0.75rem',
              fontWeight: '800'
            }}>
              {cantidadTotal}
            </span>
          )}
        </button>

        {token ? (
          <button onClick={cerrarSesion} className="btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
            Cerrar Sesión ({rol})
          </button>
        ) : (
          <Link to="/login" className="btn-primary" style={{ padding: '0.45rem 1.2rem', fontSize: '0.88rem' }}>
            Iniciar Sesión
          </Link>
        )}
      </div>
    </nav>
  );
}

// Vista de Catálogo
function CatalogoView() {
  const mochilas = [
    {
      id: 'mochila-trekking-65l',
      nombre: 'Mochila Trekking 65L Andina',
      categoria: 'Expedición / Outdoor',
      precio: 89990,
      capacidad: '65L',
      img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
      badge: 'Más Vendida'
    },
    {
      id: 'mochila-urbana-25l',
      nombre: 'Mochila Urbana Stealth 25L',
      categoria: 'Ciudad / Compartimento 16"',
      precio: 49990,
      capacidad: '25L',
      img: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=600&q=80',
      badge: 'Impermeable'
    }
  ];

  return (
    <div style={{ maxWidth: '1180px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 0.5rem 0' }}>Catálogo de Mochilas</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {mochilas.map((item) => (
          <div key={item.id} style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden', padding: '1.4rem' }}>
            <img src={item.img} alt={item.nombre} style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
            <h3 style={{ margin: '1rem 0 0.5rem 0' }}>{item.nombre}</h3>
            <p style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--primary)' }}>${item.precio.toLocaleString('es-CL')} CLP</p>
            <Link to={`/producto/${item.id}`} className="btn-primary" style={{ width: '100%', textCenter: 'center', boxSizing: 'border-box' }}>
              Ver Ficha Técnica
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'desert-canvas');
  const [modalAbierto, setModalAbierto] = useState(false);
  const { cartItems, updateQuantity, removeFromCart, cartNotification } = useCart();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const cantidadTotal = cartItems.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <div className="app-container">
      <BarraNavegacion onOpenCarrito={() => setModalAbierto(true)} cantidadTotal={cantidadTotal} />
      <Header theme={theme} handleThemeChange={(e) => setTheme(e.target.value)} />

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/catalogo" element={<CatalogoView />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/quienes-somos" element={<QuienesSomos />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* MODAL DEL CARRITO ANÓNIMO */}
      {modalAbierto && (
        <CarritoModal
          items={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onClose={() => setModalAbierto(false)}
          notification={cartNotification}
        />
      )}
    </div>
  );
}