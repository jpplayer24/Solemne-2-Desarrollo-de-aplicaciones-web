export default function Header({ theme, handleThemeChange }) {
  const temasDisponibles = [
    { id: 'stealth-black', nombre: 'Stealth Black (Urbano)' },
    { id: 'forest-cordura', nombre: 'Forest Cordura (Trekking)' },
    { id: 'desert-canvas', nombre: 'Desert Canvas (Vintage)' },
    { id: 'arctic-alpine', nombre: 'Arctic Alpine (Técnico)' },
  ];

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.6rem 2rem',
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      fontSize: '0.85rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
        <span>🎨 Colección activa:</span>
        <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>
          {theme.replace('-', ' ')}
        </strong>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <label htmlFor="theme-select" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '500' }}>
          Tema Visual:
        </label>
        <select
          id="theme-select"
          value={theme}
          onChange={handleThemeChange}
          style={{
            padding: '0.35rem 0.8rem',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-subtle)',
            outline: 'none',
            fontSize: '0.82rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          {temasDisponibles.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}