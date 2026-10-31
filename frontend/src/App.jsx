import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Login from './Login';
import ProtectedRoute from './components/ProtectedRoute';
import ProductDetail from './components/ProductDetail';
import Inicio from './components/Inicio';
import QuienesSomos from './components/QuienesSomos';

// Barra de navegación moderna con Logo DreamHUB
function BarraNavegacion() {
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
    transition: 'all 0.15s ease',
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
      boxShadow: 'var(--shadow-sm)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Sección Izquierda: Logo y Enlaces */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            color: 'var(--text-main)'
          }}
        >
          <img
            src="/logo.jpeg"
            alt="Logo DreamHUB"
            style={{
              height: '38px',
              width: 'auto',
              objectFit: 'contain',
              display: 'block'
            }}
          />
          <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.4px' }}>
            Dream<span style={{ color: 'var(--primary)' }}>HUB</span>
          </span>
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to="/" style={navLinkStyle('/')}>Inicio</Link>
          <Link to="/catalogo" style={navLinkStyle('/catalogo')}>Catálogo</Link>
          <Link to="/quienes-somos" style={navLinkStyle('/quienes-somos')}>Quiénes Somos</Link>

          {rol === 'ADMIN' && (
            <Link
              to="/admin"
              style={{
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: '700',
                color: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                padding: '0.35rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                marginLeft: '0.5rem'
              }}
            >
              🛡️ Panel Admin
            </Link>
          )}
        </div>
      </div>

      {/* Sección Derecha: Usuario y Carrito */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {token ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{
              fontSize: '0.8rem',
              padding: '0.25rem 0.6rem',
              borderRadius: '20px',
              backgroundColor: 'var(--badge-bg)',
              color: 'var(--badge-text)',
              fontWeight: '600'
            }}>
              {rol}
            </span>
            <button onClick={cerrarSesion} className="btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn-primary" style={{ padding: '0.45rem 1.2rem', fontSize: '0.88rem' }}>
            Iniciar Sesión
          </Link>
        )}
      </div>
    </nav>
  );
}

// Vista de Catálogo en Tarjetas de Mochilas
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
    },
    {
      id: 'mochila-tactica-40l',
      nombre: 'Mochila Militar Modular 40L',
      categoria: 'Táctica / Cordura',
      precio: 64990,
      capacidad: '40L',
      img: 'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?auto=format&fit=crop&w=600&q=80',
      badge: 'Ripstop'
    }
  ];

  return (
    <div style={{ maxWidth: '1180px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>
          Catálogo de Mochilas Técnicas
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
          Equipamiento con materiales hidrófugos de alta resistencia y distribución ergonómica del peso[cite: 1].
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem'
      }}>
        {mochilas.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
              transition: 'var(--transition)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
              <img
                src={item.img}
                alt={item.nombre}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                backgroundColor: 'var(--badge-bg)',
                color: 'var(--badge-text)',
                padding: '0.3rem 0.7rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: '700',
                backdropFilter: 'blur(8px)'
              }}>
                {item.badge}
              </span>
            </div>

            <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase' }}>
                {item.categoria} • {item.capacidad}
              </span>
              <h3 style={{ margin: '0.5rem 0 1rem 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>
                {item.nombre}
              </h3>

              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  ${item.precio.toLocaleString('es-CL')} <small style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CLP</small>
                </span>
                <Link to={`/producto/${item.id}`} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  Ver Ficha
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Panel Administrativo protegido
function AdminDashboard() {
  return (
    <div style={{ padding: '3.5rem 1.5rem', maxWidth: '650px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{
        padding: '2.5rem',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-surface)',
        border: '1.5px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{ color: 'var(--primary)', margin: '0 0 0.8rem 0', fontSize: '1.7rem', fontWeight: '800' }}>
          ¡Felicitaciones! Estás verificado como Administrador
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
          Has iniciado sesión con éxito y tienes acceso completo a las funciones de administración[cite: 1, 4].
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'stealth-black');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  return (
    <div className="app-container">
      <BarraNavegacion />
      <Header theme={theme} handleThemeChange={handleThemeChange} />

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/catalogo" element={<CatalogoView />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/quienes-somos" element={<QuienesSomos />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}