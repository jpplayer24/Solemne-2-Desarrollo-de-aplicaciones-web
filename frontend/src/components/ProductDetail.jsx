
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
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');

  useEffect(() => {
    setSelectedImg(0);
    setQuantity(1);
    setMensajeConfirmacion('');
    setLoading(true);

    axios
      .get(`http://localhost:8000/api/productos/${id}/`)
      .then((res) => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch(() => {
        const mochilaLocal = LISTA_MOCHILAS.find((m) => m.id === id) || LISTA_MOCHILAS[0];
        setProduct(mochilaLocal);
        setLoading(false);
      });
  }, [id]);

  if (loading || !product) {
    return (
      <div role="status" aria-live="polite" style={{ padding: '3rem', textAlign: 'center' }}>
        Cargando ficha técnica de la mochila...
      </div>
    );
  }

  const stockDisponible = Math.max(0, (product.stock_fisico || 0) - (product.stock_reservado || 0));
  const isAgotado = stockDisponible === 0;

  // Obtenemos el texto alternativo descriptivo de la imagen seleccionada
  const obtenerAltImagen = (indice) => {
    if (product.alt_imagenes && product.alt_imagenes[indice]) {
      return product.alt_imagenes[indice];
    }
    return `Fotografía ${indice + 1} de ${product.nombre}, capacidad ${product.capacidad_litros} litros`;
  };

  const handleAgregar = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity);
      setMensajeConfirmacion(`Se agregaron ${quantity} unidad(es) de "${product.nombre}" al carrito.`);
    }
  };

  return (
    <section aria-labelledby="titulo-detalle-producto" style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1rem' }}>
      <button
        type="button"
        onClick={() => navigate('/catalogo')}
        className="btn-secondary"
        style={{ marginBottom: '1.5rem' }}
      >
        ← Volver al Catálogo
      </button>

      {/* Usamos la clase responsiva grid-dos-columnas para evitar scroll horizontal en 360px y 768px */}
      <div className="grid-dos-columnas">
        {/* Galería de imágenes navegable por teclado */}
        <div>
          <img
            src={product.imagenes[selectedImg]}
            alt={obtenerAltImagen(selectedImg)}
            style={{
              width: '100%',
              maxHeight: '400px',
              objectFit: 'cover',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '1rem'
            }}
          />

          <div role="group" aria-label="Miniaturas de vistas del producto" style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {product.imagenes.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImg(idx)}
                aria-label={`Ver imagen ${idx + 1} de ${product.imagenes.length}: ${obtenerAltImagen(idx)}`}
                aria-pressed={selectedImg === idx}
                style={{
                  padding: 0,
                  background: 'none',
                  border: selectedImg === idx ? '3px solid var(--primary)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  opacity: selectedImg === idx ? 1 : 0.7
                }}
              >
                <img
                  src={img}
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: '68px',
                    height: '68px',
                    objectFit: 'cover',
                    display: 'block',
                    borderRadius: '4px'
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Ficha técnica e información de compra */}
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase' }}>
            {product.categoria} • Capacidad {product.capacidad_litros}L
          </span>

          <h1
            id="titulo-detalle-producto"
            style={{
              margin: '0.4rem 0 0.5rem 0',
              fontSize: 'clamp(1.6rem, 4vw, 2.1rem)',
              lineHeight: '1.25',
              fontWeight: '800',
              color: 'var(--text-main)',
              wordBreak: 'break-word'
            }}
          >
            {product.nombre}
          </h1>

          <p style={{ fontSize: '1.55rem', fontWeight: '800', color: 'var(--primary)', margin: '0.8rem 0' }}>
            ${product.precio.toLocaleString('es-CL')} CLP
          </p>

          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: '1rem 0 1.5rem 0' }}>
            {product.descripcion}
          </p>

          <div style={{ margin: '1.5rem 0' }}>
            {isAgotado ? (
              <span style={{ color: '#dc2626', fontWeight: '700' }}>AGOTADO</span>
            ) : (
              <span style={{ color: 'var(--primary)', fontWeight: '700' }}>
                Stock disponible: {stockDisponible} unidades
              </span>
            )}
          </div>

          {!isAgotado && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label htmlFor="cantidad-producto" style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  Cantidad
                </label>
                <input
                  id="cantidad-producto"
                  type="number"
                  min="1"
                  max={stockDisponible}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(stockDisponible, parseInt(e.target.value, 10) || 1)))}
                  style={{
                    width: '80px',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-body)',
                    color: 'var(--text-main)',
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}
                />
              </div>

              <button
                type="button"
                onClick={handleAgregar}
                className="btn-primary"
                style={{ flex: '1 1 200px', padding: '0.75rem 1rem' }}
              >
                Agregar al Carrito
              </button>
            </div>
          )}

          {/* Región accesible para anunciar al lector de pantalla que el producto se agregó */}
          {mensajeConfirmacion && (
            <div
              role="status"
              aria-live="polite"
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--badge-bg)',
                color: 'var(--text-main)',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}
            >
              {mensajeConfirmacion}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}