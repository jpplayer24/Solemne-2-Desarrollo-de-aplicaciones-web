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
import Checkout from './components/Checkout';
import ConfirmacionOrden from './components/ConfirmacionOrden';
import { useCart } from './hooks/useCart';
import { LISTA_MOCHILAS } from './data/mochilasData';

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
          <img src="/logo.jpeg" alt="Logo DreamHUB" style={{ height: '38px', width: 'auto', display: 'block', borderRadius: '4px' }} />
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

function CatalogoView() {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODAS');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 12;

  // Filtrar las 50 mochilas por texto y categoría
  const mochilasFiltradas = LISTA_MOCHILAS.filter((m) => {
    const coincideTexto = m.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCat = categoriaFiltro === 'TODAS' || m.categoria.includes(categoriaFiltro);
    return coincideTexto && coincideCat;
  });

  // Cálculo de paginación
  const totalPaginas = Math.ceil(mochilasFiltradas.length / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const mochilasPaginadas = mochilasFiltradas.slice(indiceInicio, indiceInicio + itemsPorPagina);

  const manejarCambioFiltro = (nuevaCat) => {
    setCategoriaFiltro(nuevaCat);
    setPaginaActual(1);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '800', 
          margin: '0 0 0.5rem 0', 
          color: 'var(--text-main)' 
        }}>
          Catálogo de Mochilas ({mochilasFiltradas.length} disponibles)
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Explora nuestra colección completa de equipamiento outdoor, táctico y urbano.
        </p>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
      }}>
        <input
          type="text"
          placeholder="🔍 Buscar mochila por nombre o modelo..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPaginaActual(1);
          }}
          style={{
            flex: '1 1 260px',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-body)',
            color: 'var(--text-main)',
            fontSize: '0.92rem'
          }}
        />

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['TODAS', 'Outdoor', 'Ciudad', 'Militar', 'Alta Montaña', 'Cabina'].map((cat) => (
            <button
              key={cat}
              onClick={() => manejarCambioFiltro(cat)}
              className={categoriaFiltro === cat ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grilla de Tarjetas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1.8rem' }}>
        {mochilasPaginadas.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ position: 'relative', height: '200px' }}>
              <img
                src={item.imagenes[0]}
                alt={item.nombre}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'var(--badge-bg)',
                color: 'var(--badge-text)',
                padding: '0.25rem 0.65rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: '700',
                backdropFilter: 'blur(6px)'
              }}>
                {item.badge}
              </span>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase' }}>
                {item.categoria} • {item.capacidad_litros}L
              </span>
              <h3 style={{ margin: '0.4rem 0 0.8rem 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                {item.nombre}
              </h3>

              <div style={{ marginTop: 'auto' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 0.9rem 0' }}>
                  ${item.precio.toLocaleString('es-CL')} <small style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>CLP</small>
                </p>
                <Link
                  to={`/producto/${item.id}`}
                  className="btn-primary"
                  style={{ width: '100%', textAlign: 'center', boxSizing: 'border-box', padding: '0.55rem' }}
                >
                  Ver Ficha Técnica
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controles de Paginación */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.6rem', marginTop: '2.5rem' }}>
          <button
            disabled={paginaActual === 1}
            onClick={() => setPaginaActual((p) => p - 1)}
            className="btn-secondary"
            style={{ opacity: paginaActual === 1 ? 0.5 : 1 }}
          >
            ← Anterior
          </button>

          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((numPag) => (
            <button
              key={numPag}
              onClick={() => setPaginaActual(numPag)}
              className={paginaActual === numPag ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.5rem 0.9rem' }}
            >
              {numPag}
            </button>
          ))}

          <button
            disabled={paginaActual === totalPaginas}
            onClick={() => setPaginaActual((p) => p + 1)}
            className="btn-secondary"
            style={{ opacity: paginaActual === totalPaginas ? 0.5 : 1 }}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

function AdminDashboard() {
  const [pestana, setPestana] = useState('cms');
  const [tituloBanner, setTituloBanner] = useState('Equipamiento Táctico y Urbano de Alto Rendimiento');
  const [subtituloBanner, setSubtituloBanner] = useState('Mochilas diseñadas con materiales resistentes al agua y ergonomía probada en ruta.');
  const [mensajeGuardado, setMensajeGuardado] = useState('');
  const [archivoCsv, setArchivoCsv] = useState(null);

  // Obtenemos las órdenes registradas en localStorage para que el Admin las audite
  const ordenesTotales = Object.values(JSON.parse(localStorage.getItem('dreamhub_ordenes') || '{}'));

  const guardarCambiosCMS = (e) => {
    e.preventDefault();
    // Se conectará con PUT http://localhost:8000/api/cms/inicio/ al integrar el endpoint de Django
    localStorage.setItem('cms_inicio_custom', JSON.stringify({ tituloBanner, subtituloBanner }));
    setMensajeGuardado('Textos de Inicio actualizados correctamente.');
    setTimeout(() => setMensajeGuardado(''), 3000);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
        <h1 style={{ margin: '0 0 0.4rem 0', fontSize: '1.8rem' }}>Panel de Administración DreamHUB</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          Gestión de contenidos públicos (CMS), carga masiva CSV y auditoría de órdenes.
        </p>
      </div>

      {/* Selector de Módulos Administrativos */}
      <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '2rem' }}>
        <button
          onClick={() => setPestana('cms')}
          className={pestana === 'cms' ? 'btn-primary' : 'btn-secondary'}
        >
          Editar Portada (CMS)
        </button>
        <button
          onClick={() => setPestana('csv')}
          className={pestana === 'csv' ? 'btn-primary' : 'btn-secondary'}
        >
          Importar CSV
        </button>
        <button
          onClick={() => setPestana('ordenes')}
          className={pestana === 'ordenes' ? 'btn-primary' : 'btn-secondary'}
        >
          Auditar Órdenes ({ordenesTotales.length})
        </button>
      </div>

      {/* Módulo 1: Editor CMS de Inicio */}
      {pestana === 'cms' && (
        <form
          onSubmit={guardarCambiosCMS}
          style={{
            backgroundColor: 'var(--bg-surface)',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem'
          }}
        >
          <h3 style={{ margin: 0 }}>Configuración del Banner Principal (Inicio)</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Título Principal del Banner</label>
            <input
              type="text"
              value={tituloBanner}
              onChange={(e) => setTituloBanner(e.target.value)}
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-body)',
                color: 'var(--text-main)'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Subtítulo Descriptivo</label>
            <textarea
              rows="3"
              value={subtituloBanner}
              onChange={(e) => setSubtituloBanner(e.target.value)}
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-body)',
                color: 'var(--text-main)',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {mensajeGuardado && <p style={{ color: '#10b981', fontWeight: '600', margin: 0 }}>{mensajeGuardado}</p>}

          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
            Guardar Cambios en Inicio
          </button>
        </form>
      )}

      {/* Módulo 2: Vista previa de Importación CSV */}
      {pestana === 'csv' && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <h3 style={{ marginTop: 0 }}>Importación Masiva (.CSV)</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Selecciona un archivo CSV codificado para validar estructura y cargar registros al sistema.
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setArchivoCsv(e.target.files[0])}
            style={{ marginBottom: '1rem', display: 'block' }}
          />
          {archivoCsv && (
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
              Archivo cargado: <strong>{archivoCsv.name}</strong> ({(archivoCsv.size / 1024).toFixed(2)} KB) — Listo para procesar.
            </div>
          )}
        </div>
      )}

      {/* Módulo 3: Auditoría de Órdenes (Permiso de propiedad ADMIN) */}
      {pestana === 'ordenes' && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <h3 style={{ marginTop: 0 }}>Órdenes Registradas en el Sistema</h3>
          {ordenesTotales.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Aún no se han generado órdenes de compra.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {ordenesTotales.map((ord) => (
                <div
                  key={ord.id}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-body)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong>{ord.id}</strong> — Cliente: <span>{ord.propietario_email}</span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Envío: {ord.direccion_envio} • Total: ${ord.total?.toLocaleString('es-CL')} CLP
                    </div>
                  </div>
                  <Link to={`/confirmacion/${ord.id}`} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                    Inspeccionar Comprobante
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
          Has iniciado sesión con éxito y tienes acceso completo a las funciones de administración.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'desert-canvas');
  const [modalAbierto, setModalAbierto] = useState(false);

  const { cartItems, addToCart, updateQuantity, removeFromCart, clearCart, cartNotification } = useCart();

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
          <Route path="/producto/:id" element={<ProductDetail onAddToCart={addToCart} />} />
          <Route path="/quienes-somos" element={<QuienesSomos />} />
          <Route path="/login" element={<Login />} />

          {/* Rutas Protegidas de Compra y Confirmación */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={['CLIENTE', 'ADMIN']}>
                <Checkout cartItems={cartItems} onClearCart={clearCart} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/confirmacion/:ordenId"
            element={
              <ProtectedRoute allowedRoles={['CLIENTE', 'ADMIN']}>
                <ConfirmacionOrden />
              </ProtectedRoute>
            }
          />

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