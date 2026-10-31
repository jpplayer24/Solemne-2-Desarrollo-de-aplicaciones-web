import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Inicio() {
  const [contenido, setContenido] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Consumo del microservicio de Gestión (PostgreSQL)
    axios
      .get('http://localhost:8000/api/cms/inicio/')
      .then((res) => {
        setContenido(res.data);
        setCargando(false);
      })
      .catch(() => {
        // Fallback dinámico para pruebas de interfaz mientras se conecta la API
        setContenido({
          titulo_banner: 'Equipamiento Táctico y Urbano de Alto Rendimiento',
          subtitulo_banner: 'Mochilas diseñadas con materiales resistentes al agua y ergonomía probada en ruta.',
          imagen_banner: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80',
          texto_boton: 'Explorar Catálogo',
          enlace_boton: '/catalogo',
          destacados: [
            { titulo: 'Cordura Ripstop', desc: 'Tejidos de resistencia militar contra abrasión y desgarros.' },
            { titulo: 'Cierres Estancos', desc: 'Protección hidrófuga certificada para lluvia y humedad.' },
            { titulo: 'Ajuste Ergonómico', desc: 'Arnés acolchado y correas de carga para distribución óptima de peso.' }
          ]
        });
        setCargando(false);
      });
  }, []);

  if (cargando) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando inicio...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Banner Principal Editable */}
      <div style={{
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        minHeight: '380px',
        display: 'flex',
        alignItems: 'center',
        padding: '2.5rem',
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url(${contenido.imagen_banner})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#ffffff',
        marginBottom: '2.5rem'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '800', lineHeight: 1.2, margin: '0 0 1rem 0' }}>
            {contenido.titulo_banner}
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#e5e7eb', marginBottom: '1.8rem', lineHeight: 1.5 }}>
            {contenido.subtitulo_banner}
          </p>
          <Link
            to={contenido.enlace_boton}
            className="btn-primary"
            style={{
              textDecoration: 'none',
              padding: '0.8rem 1.6rem',
              fontSize: '1rem',
              display: 'inline-block'
            }}
          >
            {contenido.texto_boton}
          </Link>
        </div>
      </div>

      {/* Bloques de Valor de Marca */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        {contenido.destacados.map((item, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: 'var(--bg-secondary, #f9fafb)',
              padding: '1.8rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #e5e7eb)'
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>{item.titulo}</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary, #6b7280)', lineHeight: 1.5, fontSize: '0.95rem' }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}