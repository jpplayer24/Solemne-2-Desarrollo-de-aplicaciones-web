import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = [
  { id: 'stealth-black', name: 'Stealth Black (Urbano)' },
  { id: 'forest-cordura', name: 'Forest Cordura (Outdoor)' },
  { id: 'desert-canvas', name: 'Desert Canvas (Vintage)' },
  { id: 'arctic-alpine', name: 'Arctic Alpine (Técnico)' },
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    localStorage.getItem('app-theme') || 'stealth-black'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);