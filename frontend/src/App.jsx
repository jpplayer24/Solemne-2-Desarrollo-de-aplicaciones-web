import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Demo from './components/Demo';
import Login from './Login';
import ProtectedRoute from './components/ProtectedRoute';
import ProductDetail from './components/ProductDetail';

// Barra de navegación con logo DreamHUB y accesos directos
function BarraNavegacion() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const rol = (localStorage.getItem('role') || 'VISITANTE').toUpperCase();

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.6rem 2rem',
      backgroundColor: 'var(--bg-secondary, #f3f4f6)',
      borderBottom: '1px solid var(--border-color, #e5e7eb)',
      fontSize: '0.95rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }}>
      {/* Sección Izquierda: Logo y Nombre DreamHUB + Enlaces */}
      <div style={{ display: 'flex', gap: '1.8rem', alignItems: 'center' }}>
        <Link 
          to="/catalogo" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.65rem', 
            textDecoration: 'none', 
            color: 'inherit' 
          }}
        >
          {/* Logo colocado en frontend/public/logo.jpeg */}
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
          <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
            DreamHUB
          </span>
        </Link>

        <Link to="/catalogo" style={{ fontWeight: '600', textDecoration: 'none', color: 'inherit' }}>
          Catálogo
        </Link>

        {rol === 'ADMIN' && (
          <Link 
            to="/admin" 
            style={{ 
              color: '#dc2626', 
              fontWeight: '700', 
              textDecoration: 'none',
              padding: '0.2rem 0.6rem',
              borderRadius: '4px',
              backgroundColor: 'rgba(220, 38, 38, 0.1)'
            }}
          >
            Panel Admin
          </Link>
        )}
      </div>

      {/* Sección Derecha: Estado de Sesión y Acciones */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {token ? (
          <>
            <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>
              Sesión: <strong>{rol}</strong>
            </span>
            <button
              onClick={cerrarSesion}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                border: '1px solid #dc2626',
                backgroundColor: 'transparent',
                color: '#dc2626',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Cerrar Sesión
            </button>
          </>
        ) : (
          <Link
            to="/login"
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '4px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Iniciar Sesión
          </Link>
        )}
      </div>
    </nav>
  );
}

// Vista de Catálogo integrada con el Demo
function CatalogoView({ theme }) {
  return (
    <div>
      <Demo theme={theme} />
      <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '1rem', textAlign: 'center' }}>
        <h3>Mochilas Disponibles</h3>
        <p style={{ color: 'var(--text-secondary, #6b7280)' }}>
          Haz clic en un producto para revisar la ficha técnica y galería:
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
          <Link to="/producto/mochila-trekking-65l" className="btn-primary" style={{ textDecoration: 'none' }}>
            Ficha: Mochila Trekking 65L
          </Link>
          <Link to="/producto/mochila-urbana-25l" className="btn-primary" style={{ textDecoration: 'none' }}>
            Ficha: Mochila Urbana 25L
          </Link>
        </div>
      </div>
    </div>
  );
}

// Panel Administrativo protegido
function AdminDashboard() {
  return (
    <div style={{ padding: '3rem 1.5rem', maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{
        padding: '2.5rem',
        borderRadius: '12px',
        backgroundColor: 'var(--bg-secondary, #f0fdf4)',
        border: '1.5px solid #86efac',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{ color: '#166534', margin: '0 0 0.8rem 0', fontSize: '1.8rem', fontWeight: '800' }}>
          ¡Felicitaciones! Estás verificado como Administrador
        </h1>
        <p style={{ color: '#15803d', fontSize: '1.05rem', margin: 0, fontWeight: '500' }}>
          Has iniciado sesión con éxito y tienes acceso completo a las funciones de administración.
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
      {/* Barra superior persistente con Logo DreamHUB e Iniciar Sesión */}
      <BarraNavegacion />

      {/* Header y selector de temas */}
      <Header theme={theme} handleThemeChange={handleThemeChange} />

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<CatalogoView theme={theme} />} />
          <Route path="/catalogo" element={<CatalogoView theme={theme} />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
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