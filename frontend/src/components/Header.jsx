function Header({ theme, handleThemeChange }) {
    return (
        <header>
        <h1>Tienda de Mochilas</h1>

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
    );
}

export default Header;