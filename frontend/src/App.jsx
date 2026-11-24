// Importamos los hooks principales de React para manejar estados y efectos secundarios
import { useState, useEffect } from 'react';
// Importamos las herramientas de react-router-dom para navegar entre páginas sin recargar
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
// Importamos los estilos globales y las variables de los temas visuales
import './App.css';

import axios from 'axios';

// Importamos los componentes y vistas de nuestra aplicación
import Header from './components/Header';
import Login from './Login';
import ProtectedRoute from './components/ProtectedRoute';
import ProductDetail from './components/ProductDetail';
import Inicio from './components/Inicio';
import QuienesSomos from './components/QuienesSomos';
import CarritoModal from './components/CarritoModal';
import Checkout from './components/Checkout';
import ConfirmacionOrden from './components/ConfirmacionOrden';
import ImportarCSV from './components/ImportarCSV';

// Importamos nuestro hook personalizado del carrito
import { useCart } from './hooks/useCart';

// ============================================================================
// Componente: BarraNavegacion
// Muestra el logo, los enlaces principales, el botón del carrito y el control de sesión
// ============================================================================
function BarraNavegacion({ onOpenCarrito, cantidadTotal }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Revisamos en localStorage si hay un usuario logueado y cuál es su rol
  const token = localStorage.getItem('token');
  const rol = (localStorage.getItem('role') || 'VISITANTE').toUpperCase();

  // Función para cerrar sesión limpiando los datos guardados en el navegador
  const cerrarSesion = async () => {
    try {
      await axios.post('/api/auth/logout/', null, {
        headers: { Authorization: `Token ${token}` },
      });
    } catch (e) {
      // Token ya inválido, igual limpiamos
    }
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  // Estilo dinámico para resaltar el enlace de la página en la que estamos parados
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
    <nav aria-label="Navegación principal" className="navbar-principal">
      {/* Lado izquierdo: Logo de DreamHUB y menú de navegación adaptable */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem', alignItems: 'center' }}>
        <Link
          to="/"
          aria-label="Ir a la página de inicio de DreamHUB"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'var(--text-main)' }}
        >
          <img
            src="/logo.jpeg"
            alt="Isotipo de DreamHUB, tienda de mochilas técnicas y urbanas"
            style={{ height: '38px', width: 'auto', display: 'block', borderRadius: '4px' }}
          />
          <span style={{ fontSize: '1.25rem', fontWeight: '800' }}>
            Dream<span style={{ color: 'var(--primary)' }}>HUB</span>
          </span>
        </Link>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          <Link to="/" aria-current={location.pathname === '/' ? 'page' : undefined} style={navLinkStyle('/')}>
            Inicio
          </Link>
          <Link to="/catalogo" aria-current={location.pathname === '/catalogo' ? 'page' : undefined} style={navLinkStyle('/catalogo')}>
            Catálogo
          </Link>
          <Link to="/quienes-somos" aria-current={location.pathname === '/quienes-somos' ? 'page' : undefined} style={navLinkStyle('/quienes-somos')}>
            Quiénes Somos
          </Link>

          {/* Si el usuario tiene rol ADMIN, mostramos el acceso directo a su panel */}
          {rol === 'ADMIN' && (
            <Link
              to="/admin"
              aria-current={location.pathname === '/admin' ? 'page' : undefined}
              style={{
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: '700',
                color: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                padding: '0.35rem 0.8rem',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              Panel Admin
            </Link>
          )}
        </div>
      </div>

      {/* Lado derecho: Botón del carrito con contador y botón de Login/Logout */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'center' }}>
        <button
          type="button"
          onClick={onOpenCarrito}
          aria-label={`Abrir carrito de compras, ${cantidadTotal} ${cantidadTotal === 1 ? 'mochila agregada' : 'mochilas agregadas'}`}
          className="btn-secondary"
          style={{ position: 'relative', padding: '0.55rem 1rem' }}
        >
          Carrito
          {cantidadTotal > 0 && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                borderRadius: '50%',
                padding: '0.15rem 0.45rem',
                fontSize: '0.75rem',
                fontWeight: '800'
              }}
            >
              {cantidadTotal}
            </span>
          )}
        </button>

        {token ? (
          <button
            type="button"
            onClick={cerrarSesion}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
          >
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

// ============================================================================
// Componente: CatalogoView
// Muestra las mochilas desde Django/MongoDB con buscador, filtros y paginación
// ============================================================================
function CatalogoView() {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODAS');
  const [paginaActual, setPaginaActual] = useState(1);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const itemsPorPagina = 12;

  // Cargar productos activos desde Django y MongoDB
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setLoading(true);
        setError('');

        const respuesta = await axios.get('/api/products/?limit=50');

        if (respuesta.data.status !== 'success') {
          throw new Error('No fue posible obtener el catálogo.');
        }

        const productosBackend = respuesta.data.data || [];

        // Adaptar los campos de Django al formato que utiliza React
        const productosAdaptados = productosBackend.map((producto) => {
          return {
            id: producto.sku,
            sku: producto.sku,
            nombre: producto.nombre,
            categoria: producto.categoria_id,
            precio: producto.precio,
            descripcion: producto.descripcion,
            capacidad_litros: producto.capacidad_litros,
            badge: producto.badge,
            imagenes: producto.imagenes || [],
            alt_imagenes: producto.alt_imagenes || [],
            stock_fisico: producto.stock_inicial,
            stock_reservado: producto.stock_reservado,
            stock_disponible: producto.stock_disponible,
            disponible: producto.disponible,
          };
        });

        setProductos(productosAdaptados);
      } catch (err) {
        console.error('Error al cargar el catálogo:', err);
        setError('No pudimos cargar los productos. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    cargarProductos();
  }, []);

  // Filtrar los productos obtenidos desde MongoDB
  const mochilasFiltradas = productos.filter((m) => {
    const coincideTexto = m.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase());

    const coincideCat =
      categoriaFiltro === 'TODAS' ||
      m.categoria.toLowerCase().includes(categoriaFiltro.toLowerCase());

    return coincideTexto && coincideCat;
  });

  // Paginación visual de 12 productos
  const totalPaginas = Math.ceil(mochilasFiltradas.length / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const mochilasPaginadas = mochilasFiltradas.slice(indiceInicio, indiceInicio + itemsPorPagina);

  const manejarCambioFiltro = (nuevaCat) => {
    setCategoriaFiltro(nuevaCat);
    setPaginaActual(1);
  };

  if (loading) {
    return (
      <div role="status" aria-live="polite" style={{ padding: '3rem', textAlign: 'center' }}>
        Cargando catálogo de productos...
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>{error}</p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <section aria-labelledby="titulo-catalogo" style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1
          id="titulo-catalogo"
          style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: '800',
            margin: '0 0 0.5rem 0',
            color: 'var(--text-main)'
          }}
        >
          Catálogo de Mochilas ({mochilasFiltradas.length} disponibles)
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Explora nuestra colección completa de equipamiento outdoor, táctico y urbano.
        </p>
      </div>

      {/* Barra de búsqueda y filtros accesibles */}
      <div
        role="search"
        aria-label="Filtrar catálogo de mochilas"
        style={{
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
        }}
      >
        <input
          type="text"
          aria-label="Buscar mochila por nombre o modelo"
          placeholder="Buscar mochila por nombre o modelo..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPaginaActual(1);
          }}
          style={{
            flex: '1 1 240px',
            minWidth: 0,
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-body)',
            color: 'var(--text-main)',
            fontSize: '0.92rem'
          }}
        />

        <div role="group" aria-label="Filtrar por categoría" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['TODAS', 'Outdoor', 'Ciudad', 'Militar', 'Alta Montaña', 'Cabina'].map((cat) => (
            <button
              key={cat}
              type="button"
              aria-pressed={categoriaFiltro === cat}
              onClick={() => manejarCambioFiltro(cat)}
              className={categoriaFiltro === cat ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {mochilasFiltradas.length === 0 ? (
        <p role="status" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          No se encontraron productos.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {mochilasPaginadas.map((item) => {
            // Construimos un texto alternativo descriptivo cumpliendo WCAG 1.1.1 (RNF-07)
            const textoAltDescriptivo =
              item.alt_imagenes && item.alt_imagenes[0]
                ? item.alt_imagenes[0]
                : `Fotografía de ${item.nombre}, categoría ${item.categoria}${item.capacidad_litros ? `, capacidad de ${item.capacidad_litros} litros` : ''}`;

            return (
              <article
                key={item.sku}
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
                    alt={textoAltDescriptivo}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {item.badge && (
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
                  )}
                </div>

                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase' }}>
                    {item.categoria} {item.capacidad_litros ? `• ${item.capacidad_litros}L` : ''}
                  </span>

                  <h2 style={{ margin: '0.4rem 0 0.8rem 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                    {item.nombre}
                  </h2>

                  <div style={{ marginTop: 'auto' }}>
                    <p style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 0.9rem 0' }}>
                      ${item.precio.toLocaleString('es-CL')} <small style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>CLP</small>
                    </p>

                    <Link
                      to={`/producto/${encodeURIComponent(item.sku)}`}
                      aria-label={`Ver ficha técnica de ${item.nombre}`}
                      className="btn-primary"
                      style={{ width: '100%', textAlign: 'center', boxSizing: 'border-box', padding: '0.55rem' }}
                    >
                      Ver Ficha Técnica
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {totalPaginas > 1 && (
        <nav aria-label="Paginación del catálogo" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '0.6rem', marginTop: '2.5rem' }}>
          <button
            type="button"
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
              type="button"
              aria-current={paginaActual === numPag ? 'page' : undefined}
              onClick={() => setPaginaActual(numPag)}
              className={paginaActual === numPag ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.5rem 0.9rem' }}
            >
              {numPag}
            </button>
          ))}

          <button
            type="button"
            disabled={paginaActual === totalPaginas}
            onClick={() => setPaginaActual((p) => p + 1)}
            className="btn-secondary"
            style={{ opacity: paginaActual === totalPaginas ? 0.5 : 1 }}
          >
            Siguiente →
          </button>
        </nav>
      )}
    </section>
  );
}

// ============================================================================
// Componente: AdminDashboard
// Panel exclusivo para usuarios con rol ADMIN (CMS, carga CSV y auditoría de órdenes)
// ============================================================================
function AdminDashboard() {
  // Estado para cambiar entre las 3 pestañas del administrador
  const [pestana, setPestana] = useState('cms');
  // Estados para editar los textos de la portada (RF-02)
  const [tituloBanner, setTituloBanner] = useState('Equipamiento Táctico y Urbano de Alto Rendimiento');
  const [subtituloBanner, setSubtituloBanner] = useState('Mochilas diseñadas con materiales resistentes al agua y ergonomía probada en ruta.');
  const [mensajeGuardado, setMensajeGuardado] = useState('');

  // Leemos todas las órdenes guardadas para que el administrador pueda revisarlas
  const ordenesTotales = Object.values(JSON.parse(localStorage.getItem('dreamhub_ordenes') || '{}'));

  // Guarda los cambios del banner en localStorage (y a futuro en el endpoint de Django)
  const guardarCambiosCMS = (e) => {
    e.preventDefault();
    localStorage.setItem('cms_inicio_custom', JSON.stringify({ tituloBanner, subtituloBanner }));
    setMensajeGuardado('Textos de Inicio actualizados correctamente.');
    setTimeout(() => setMensajeGuardado(''), 3000);
  };

  return (
    <section aria-labelledby="titulo-admin" style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
        <h1
          id="titulo-admin"
          style={{ margin: '0 0 0.4rem 0', fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', color: 'var(--text-main)' }}
        >
          Panel de Administración DreamHUB
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          Gestión de contenidos públicos (CMS), carga masiva CSV y auditoría de órdenes.
        </p>
      </div>

      {/* Botones adaptables para navegar entre los módulos del administrador sin scroll horizontal */}
      <div role="tablist" aria-label="Módulos de administración" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '2rem' }}>
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'cms'}
          onClick={() => setPestana('cms')}
          className={pestana === 'cms' ? 'btn-primary' : 'btn-secondary'}
        >
          Editar Portada (CMS)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'csv'}
          onClick={() => setPestana('csv')}
          className={pestana === 'csv' ? 'btn-primary' : 'btn-secondary'}
        >
          Importar CSV
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'ordenes'}
          onClick={() => setPestana('ordenes')}
          className={pestana === 'ordenes' ? 'btn-primary' : 'btn-secondary'}
        >
          Auditar Órdenes ({ordenesTotales.length})
        </button>
      </div>

      {/* Vista 1: Formulario para editar el banner de Inicio */}
      {pestana === 'cms' && (
        <form
          onSubmit={guardarCambiosCMS}
          style={{
            backgroundColor: 'var(--bg-surface)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Configuración del Banner Principal (Inicio)</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label htmlFor="admin-titulo-banner" style={{ fontWeight: '600', fontSize: '0.9rem' }}>
              Título Principal del Banner
            </label>
            <input
              id="admin-titulo-banner"
              type="text"
              value={tituloBanner}
              onChange={(e) => setTituloBanner(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-body)',
                color: 'var(--text-main)'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label htmlFor="admin-subtitulo-banner" style={{ fontWeight: '600', fontSize: '0.9rem' }}>
              Subtítulo Descriptivo
            </label>
            <textarea
              id="admin-subtitulo-banner"
              rows="3"
              value={subtituloBanner}
              onChange={(e) => setSubtituloBanner(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-body)',
                color: 'var(--text-main)',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {mensajeGuardado && (
            <p role="status" aria-live="polite" style={{ color: '#10b981', fontWeight: '600', margin: 0 }}>
              {mensajeGuardado}
            </p>
          )}

          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
            Guardar Cambios en Inicio
          </button>
        </form>
      )}

      {/* Vista 2: Importación masiva CSV con visualizador de informe */}
      {pestana === 'csv' && <ImportarCSV />}

      {/* Vista 3: Listado adaptable de órdenes para auditoría del Admin */}
      {pestana === 'ordenes' && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: '1.2rem' }}>Órdenes Registradas en el Sistema</h2>
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
                    flexWrap: 'wrap',
                    gap: '0.8rem',
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
    </section>
  );
}

// ============================================================================
// Componente Principal: App
// Controla el tema visual global, el modal del carrito y las rutas de la web
// ============================================================================
export default function App() {
  // Cargamos el tema guardado en localStorage o usamos 'desert-canvas' (Vintage) por defecto
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'desert-canvas');
  // Estado para abrir o cerrar la ventana emergente del carrito
  const [modalAbierto, setModalAbierto] = useState(false);

  // Obtenemos los productos y funciones desde nuestro hook personalizado useCart
  const { cartItems, addToCart, updateQuantity, removeFromCart, clearCart, cartNotification } = useCart();

  // Cada vez que cambia el tema, lo aplicamos al atributo HTML y lo guardamos en localStorage (RB-10)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // Sumamos todas las unidades que hay en el carrito para mostrar el número en la barra
  const cantidadTotal = cartItems.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <div className="app-container">
      {/* Enlace de salto rápido al contenido principal para usuarios de teclado (WCAG 2.4.1) */}
      <a href="#contenido-principal" className="skip-link">
        Saltar al contenido principal
      </a>

      {/* Barra superior fija */}
      <BarraNavegacion onOpenCarrito={() => setModalAbierto(true)} cantidadTotal={cantidadTotal} />
      {/* Selector de temas visuales */}
      <Header theme={theme} handleThemeChange={(e) => setTheme(e.target.value)} />

      {/* Contenedor principal donde cambian las páginas según la URL */}
      <main id="contenido-principal" tabIndex="-1" style={{ flex: 1 }}>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Inicio />} />
          <Route path="/catalogo" element={<CatalogoView />} />
          <Route path="/producto/:id" element={<ProductDetail onAddToCart={addToCart} />} />
          <Route path="/quienes-somos" element={<QuienesSomos />} />
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas para clientes autenticados y administradores */}
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

          {/* Ruta exclusiva para administradores */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Si el usuario escribe una URL que no existe, lo redirigimos al Inicio */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Ventana modal del carrito que se muestra solo cuando modalAbierto es true */}
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