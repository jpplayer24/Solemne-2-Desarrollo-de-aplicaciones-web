import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ProductDetail({ onAddToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedImg, setSelectedImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`http://localhost:8000/api/productos/${id}/`)
      .then((res) => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch(() => {
        setProduct({
          id: id || 'mochila-trekking-65l',
          nombre: 'Mochila Trekking 65L Andina',
          precio: 89990,
          descripcion: 'Mochila de alta capacidad construida con Cordura Ripstop de 1000D e impermeable.',
          capacidad_litros: 65,
          stock_fisico: 10,
          stock_reservado: 2,
          activo: true,
          imagenes: [
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?auto=format&fit=crop&w=600&q=80',
          ]
        });
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando producto...</div>;

  const stockDisponible = Math.max(0, (product.stock_fisico || 0) - (product.stock_reservado || 0));
  const isAgotado = stockDisponible === 0;

  const handleAgregar = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity);
      alert(`¡${quantity} unidad(es) agregada(s) al carrito!`);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <button 
        onClick={() => navigate('/catalogo')}
        className="btn-secondary"
        style={{ marginBottom: '1.5rem' }}
      >
        &larr; Volver al Catálogo
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
          <h1 style={{ 
            margin: '0 0 0.5rem 0', 
            fontSize: '2.2rem',
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