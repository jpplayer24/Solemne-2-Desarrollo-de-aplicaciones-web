import { useState, useEffect } from 'react';
import './App.css';
import Login from './Login';
import Header from './components/Header';
import Demo from './components/Demo'; // Importamos el nuevo componente

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  return (
    <div className="app-container">
      <Header theme={theme} handleThemeChange={handleThemeChange} />
      
      <Demo theme={theme} />
    </div>
  );
}

export default App;
