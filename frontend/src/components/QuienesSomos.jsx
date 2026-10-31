import { useState, useEffect } from 'react';
import axios from 'axios';

export default function QuienesSomos() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Consumo del endpoint administrable en PostgreSQL
    axios
      .get('http://localhost:8000/api/cms/quienes-somos/')
      .then((res) => {
        setDatos(res.data);
        setCargando(false);
      })
      .catch(() => {
        // Fallback con la identidad de DreamHUB
        setDatos({
          titulo: 'Sobre DreamHUB',
          mision: 'Diseñamos y distribuimos mochilas creadas para resistir los desafíos cotidianos de la ciudad y las exigencias técnicas del outdoor, uniendo estética minimalista con ingeniería ergonómica.',
          imagen_taller: 'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?auto=format&fit=crop&w=800&q=80',
          valores: [
            { titulo: 'Durabilidad Extrema', descripcion: 'Seleccionamos telas de alta tenacidad que evitan desgarros y extienden la vida útil del producto.' },
            { titulo: 'Ergonomía Activa', descripcion: 'Sistemas de suspensión pensados para cuidar la postura y repartir el peso en trayectos largos.' },
            { titulo: 'Garantía Técnica', descripcion: 'Respaldamos la confección, costuras y herrajes frente a fallas de fábrica.' }
          ]
        });
        setCargando(false);
      });
  }, []);

  if (cargando) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando información...</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '1.5rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-primary)' }}>
        {datos.titulo}
      </h1>
      <p style={{
        textAlign: 'center',
        maxWidth: '750px',
        margin: '0 auto 2.5rem auto',
        fontSize: '1.1rem',
        lineHeight: 1.6,
        color: 'var(--text-secondary, #6b7280)'
      }}>
        {datos.mision}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2.5rem',
        alignItems: 'center',
        marginBottom: '3rem'
      }}>
        <img
          src={datos.imagen_taller}
          alt="Confección y diseño de mochilas"
          style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-color, #e5e7eb)', objectFit: 'cover', height: '320px' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {datos.valores.map((val, idx) => (
            <div key={idx} style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary, #f9fafb)', borderRadius: '6px' }}>
              <h4 style={{ margin: '0 0 0.3rem 0', color: 'var(--text-primary)' }}>{val.titulo}</h4>
              <p style={{ margin: 0, color: 'var(--text-secondary, #6b7280)', fontSize: '0.9rem' }}>{val.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}