import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedImg, setSelectedImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Consumo del microservicio de Catálogo (MongoDB)
    axios
      .get(`http://localhost:8000/api/productos/${id}/`)
      .then((res) => {
        // RF-21: Un producto inactivo o no disponible no se presenta
        if (!res.data.activo) {
          setError('El producto no se encuentra disponible.');
        } else {
          setProduct(res.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError('Producto no encontrado.');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando especificaciones...</div>;
  if (error || !product) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>{error || 'Producto no disponible'}</h2>
        <button className="btn-primary" onClick={() => navigate('/catalogo')}>
          Volver al catálogo
        </button>
      </div>
    );
  }

  // Stock disponible: físico - reservado
  const stockDisponible = Math.max(0, (product.stock_fisico || 0) - (product.stock_reservado || 0));
  const isAgotado = stockDisponible === 0;

  // Validación de 4 a 6 imágenes (RF-21 / RB-05)
  const images = Array.isArray(product.imagenes) && product.imagenes.length >= 4 
    ? product.imagenes 
    : [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?auto=format&fit=crop&w=600&q=80',
      ];

  const handleAddToCart = () => {
    // RF-22: Agregar al carrito local anónimo (RB-01: no reserva stock aún)
    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = currentCart.findIndex((item) => item.id === product.id);

    if (existingIndex > -1) {
      currentCart[existingIndex].cantidad += quantity;
    } else {
      currentCart.push({
        id: product.id,
        nombre: product.nombre,
        precio: product.precio,
        imagen: images[0],
        cantidad: quantity,
      });
    }

    localStorage.setItem('cart', JSON.stringify(currentCart));
    alert(`${quantity} unidad(es) de ${product.nombre} agregada(s) al carrito.`);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1rem' }}>
      <button 
        onClick={() => navigate('/catalogo')} 
        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '1rem' }}
      >
        &larr; Volver a Mochilas
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
        {/* Galería de 4 a 6 imágenes */}
        <div>
          <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
            <img
              src={images[selectedImg]}
              alt={`Vista ${selectedImg + 1} de ${product.nombre}`}
              style={{ width: '100%', height: '420px', objectFit: 'cover', display: 'block' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Miniatura ${idx + 1}`}
                onClick={() => setSelectedImg(idx)}
                style={{
                  width: '75px',
                  height: '75px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: selectedImg === idx ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                  opacity: selectedImg === idx ? 1 : 0.6,
                }}
              />
            ))}
          </div>
        </div>

        {/* Ficha técnica y compra */}
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 600 }}>
            {product.categoria || 'Mochilas Técnicas'}
          </span>
          <h1 style={{ margin: '0.5rem 0', fontSize: '1.8rem' }}>{product.nombre}</h1>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)', margin: '0.5rem 0' }}>
            ${Number(product.precio || 0).toLocaleString('es-CL')} CLP
          </p>

          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{product.descripcion}</p>

          <div style={{ margin: '1.5rem 0', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Especificaciones de la Mochila:</h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <li>Capacidad: {product.capacidad_litros || '30'} Litros</li>
              <li>Compartimento Laptop: Hasta {product.laptop_pulgadas || '16'} pulgadas</li>
              <li>Material: Cordura Ripstop impermeable con cierres estancos</li>
            </ul>
          </div>

          <div style={{ margin: '1rem 0' }}>
            {isAgotado ? (
              <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.1rem' }}>AGOTADO</span>
            ) : (
              <span style={{ color: '#10b981', fontWeight: 600 }}>
                En stock ({stockDisponible} unidades disponibles)
              </span>
            )}
          </div>

          {!isAgotado && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1.5rem' }}>
              <input
                type="number"
                min="1"
                max={stockDisponible}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(stockDisponible, parseInt(e.target.value) || 1)))}
                style={{
                  width: '60px',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                }}
              />
              <button className="btn-primary" onClick={handleAddToCart}>
                Agregar al Carrito
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}