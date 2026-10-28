export default function Demo({theme}) {
    function boton1(){
        alert(`¡Has hecho clic en el botón de acción! El tema actual es: ${theme}`);
    }
    return (
        <main>
            <section className="demo-section">
                <h2>Demostración de Paleta</h2>
                <p>Este texto se adapta a la paleta de colores seleccionada.</p>
                <div className="button-group">
                    <button onClick= {boton1}className="primary-btn" style={{backgroundColor: 'var(--accent)', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '5px', marginTop: '10px'}}>
                        En que tema estoy?
                    </button>
                </div>
                <div className="code-demo" style={{marginTop: '20px'}}>
                    <code>Variable --bg: {theme === 'light' ? '#ffffff' : 'dinámica'}</code>
                </div>
            </section>
        </main>
    );
}