import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Demo from './components/Demo';
import Login from './Login';
import ProtectedRoute from './components/ProtectedRoute';
import ProductDetail from './components/ProductDetail';

// Vista de Catálogo integrada con el Demo actual de tu equipo
function CatalogoView({ theme }) {
  return (
    <div>
      <Demo theme={theme} />
      <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '1rem', textAlign: 'center' }}>
        <h3>Mochilas Disponibles</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Haz clic en un producto para revisar la ficha técnica y galería:</p>
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

// Panel Administrativo protegido (Solo accesible para ADMIN)
function AdminDashboard() {
  return (
    <div style={{ padding: '2.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Panel de Administración</h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Área restringida. Solo visible para usuarios con rol <strong>ADMIN</strong> autenticados.
      </p>
      <div style={{
        marginTop: '1.5rem',
        padding: '1.5rem',
        borderRadius: '8px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)'
      }}>
        <h3>Módulos de Gestión Hito 2</h3>
        <ul>
          <li>Gestión y Bloqueo de Usuarios (RF-14, RF-15)</li>
          <li>Creación de Administradores (RF-11)</li>
          <li>Gestión de Contenidos y Banners (RF-02, RF-03)</li>
          <li>Buzón de Mensajes de Contacto (RF-06)</li>
        </ul>
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'stealth-black');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Tu Header original se mantiene arriba en todas las páginas y recibe el theme */}
        <Header theme={theme} handleThemeChange={handleThemeChange} />

        <main style={{ flex: 1 }}>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<CatalogoView theme={theme} />} />
            <Route path="/catalogo" element={<CatalogoView theme={theme} />} />
            <Route path="/producto/:id" element={<ProductDetail />} />
            <Route path="/login" element={<Login />} />

            {/* Ruta Protegida: Administrador */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Redirección ante rutas no encontradas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;