import { useState, useEffect } from 'react';
import './App.css'; // Asumiendo que mantienes tu App.css para estilos de componentes
// index.css ya está importado en main.jsx de forma global

function App() {
  // 1. Inicialización del estado. Busca un tema guardado o usa 'light' por defecto.
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'light');

  // 2. Efecto Secundario: Inyección directa al DOM y persistencia en LocalStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // 3. Controlador de eventos para el selector
  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  return (
    <div className="app-container">
      <header>
        <h1>Tienda de Mochilas</h1>
        
        {/* Selector de Temas */}
        <div className="theme-selector">
          <label htmlFor="theme-select">Tema visual: </label>
          <select id="theme-select" value={theme} onChange={handleThemeChange}>
            <option value="light">Claro (Predeterminado)</option>
            <option value="dark">Oscuro</option>
            <option value="nature">Naturaleza</option>
            <option value="contrast">Alto Contraste</option>
          </select>
        </div>
      </header>

      <main>
        <section className="demo-section">
          <h2>Demostración de Paleta</h2>
          <p>Este texto se adapta a la paleta de colores seleccionada.</p>
          <div className="button-group">
            <button className="primary-btn" style={{backgroundColor: 'var(--accent)', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '5px', marginTop: '10px'}}>
              Botón de Acción
            </button>
          </div>
          <div className="code-demo" style={{marginTop: '20px'}}>
            <code>Variable --bg: {theme === 'light' ? '#ffffff' : 'dinámica'}</code>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;