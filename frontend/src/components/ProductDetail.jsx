import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LISTA_MOCHILAS } from '../data/mochilasData';

export default function ProductDetail({ onAddToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedImg, setSelectedImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedImg(0);
    setQuantity(1);
    setLoading(true);

    axios
      .get(`http://localhost:8000/api/productos/${id}/`)
      .then((res) => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch(() => {
        // Buscamos la mochila exacta dentro de nuestro catálogo de 50 productos
        const mochilaLocal = LISTA_MOCHILAS.find((m) => m.id === id) || LISTA_MOCHILAS[0];
        setProduct(mochilaLocal);
        setLoading(false);
      });
  }, [id]);

  if (loading || !product) return <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando producto...</div>;

  const stockDisponible = Math.max(0, (product.stock_fisico || 0) - (product.stock_reservado || 0));
  const isAgotado = stockDisponible === 0;

  const handleAgregar = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity);
      alert(`¡${quantity} unidad(es) de "${product.nombre}" agregada(s) al carrito!`);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <button 
        onClick={() => navigate('/catalogo')}
        className="btn-secondary"
        style={{ marginBottom: '1.5rem' }}
      >
        ← Volver al Catálogo
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
        <div>
          <img
            src={product.imagenes[selectedImg]}
            alt={product.nombre}
            style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: 'var(--radius-lg)', marginBottom: '1rem' }}
          />
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            {product.imagenes.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt="Vista previa"
                onClick={() => setSelectedImg(idx)}
                style={{
                  width: '70px',
                  height: '70px',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  border: selectedImg === idx ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                  opacity: selectedImg === idx ? 1 : 0.6
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase' }}>
            {product.categoria} • Capacidad {product.capacidad_litros}L
          </span>
          <h1 style={{ 
            margin: '0.4rem 0 0.5rem 0', 
            fontSize: '2.1rem',
            lineHeight: '1.25',
            fontWeight: '800',
            color: 'var(--text-main)',
            wordBreak: 'break-word'
          }}>
            {product.nombre}
          </h1>

          <p style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--primary)', margin: '0.8rem 0' }}>
            ${product.precio.toLocaleString('es-CL')} CLP
          </p>

          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: '1rem 0 1.5rem 0' }}>
            {product.descripcion}
          </p>

          <div style={{ margin: '1.5rem 0' }}>
            {isAgotado ? (
              <span style={{ color: '#ef4444', fontWeight: '700' }}>AGOTADO</span>
            ) : (
              <span style={{ color: 'var(--primary)', fontWeight: '600' }}>
                Stock disponible: {stockDisponible} unidades
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
                  width: '70px',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-body)',
                  color: 'var(--text-main)',
                  fontSize: '1rem',
                  textAlign: 'center'
                }}
              />
              <button onClick={handleAgregar} className="btn-primary" style={{ flex: 1, padding: '0.75rem' }}>
                🛒 Agregar al Carrito
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}