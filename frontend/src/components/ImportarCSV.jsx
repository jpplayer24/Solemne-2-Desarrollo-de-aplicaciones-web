import { useState } from 'react';
import axios from 'axios';

const ENDPOINT_CSV = 'http://localhost:8000/api/clientes/importar-csv/';

export default function ImportarCSV() {
  const [archivoCsv, setArchivoCsv] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');
  const [informe, setInforme] = useState(null);

  const manejarSeleccion = (e) => {
    const file = e.target.files[0];
    setArchivoCsv(file || null);
    setErrorGeneral('');
    setInforme(null);
  };

  // Genera una plantilla válida RF-12 para probar rápido o mostrar en la defensa
  const descargarPlantilla = () => {
    const contenido =
      'email,nombre,apellido,rol\n' +
      'cliente.prueba@dreamhub.cl,Ana,Pérez,CLIENTE\n' +
      'admin.prueba@dreamhub.cl,Carlos,Rojas,ADMIN\n';
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_usuarios_dreamhub.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const procesarArchivo = async (e) => {
    e.preventDefault();
    if (!archivoCsv) {
      setErrorGeneral('Debes seleccionar un archivo .csv antes de importar.');
      return;
    }

    setCargando(true);
    setErrorGeneral('');
    setInforme(null);

    try {
      const formData = new FormData();
      formData.append('archivo', archivoCsv);

      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (token && !token.startsWith('simulated_')) {
        headers['Authorization'] = `Token ${token}`;
      }

      const { data } = await axios.post(ENDPOINT_CSV, formData, { headers });
      setInforme(data);
    } catch (err) {
      if (err.response?.data?.error) {
        setErrorGeneral(err.response.data.error);
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setErrorGeneral('No autorizado: inicia sesión con una cuenta ADMIN real.');
      } else {
        setErrorGeneral('No se pudo conectar con backend_gestion en http://localhost:8000.');
      }
    } finally {
      setCargando(false);
    }
  };

  const limpiar = () => {
    setArchivoCsv(null);
    setErrorGeneral('');
    setInforme(null);
  };

  const thStyle = {
    textAlign: 'left',
    padding: '0.7rem 0.9rem',
    borderBottom: '1px solid var(--border-subtle)',
    fontSize: '0.78rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-body)',
  };

  const tdStyle = {
    padding: '0.7rem 0.9rem',
    borderBottom: '1px solid var(--border-subtle)',
    fontSize: '0.88rem',
    color: 'var(--text-main)',
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        padding: '2rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 0.35rem 0', color: 'var(--text-main)' }}>
            Importación Masiva de Usuarios (.CSV)
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Archivo UTF-8 con columnas <strong>email, nombre, apellido, rol</strong> (máx. 200 filas, roles CLIENTE o ADMIN, sin contraseña).
          </p>
        </div>
        <button
          type="button"
          onClick={descargarPlantilla}
          className="btn-secondary"
          style={{ padding: '0.5rem 0.95rem', fontSize: '0.85rem' }}
        >
          Descargar plantilla CSV
        </button>
      </div>

      {/* Formulario de carga */}
      <form
        onSubmit={procesarArchivo}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}
      >
        <input
          type="file"
          accept=".csv"
          onChange={manejarSeleccion}
          style={{
            padding: '0.85rem',
            backgroundColor: 'var(--bg-body)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-main)',
            cursor: 'pointer',
          }}
        />

        {archivoCsv && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.88rem',
              color: 'var(--text-muted)',
            }}
          >
            Archivo seleccionado:{' '}
            <strong style={{ color: 'var(--text-main)' }}>{archivoCsv.name}</strong> (
            {(archivoCsv.size / 1024).toFixed(2)} KB)
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={!archivoCsv || cargando}
            style={{ opacity: !archivoCsv || cargando ? 0.6 : 1 }}
          >
            {cargando ? 'Procesando archivo...' : 'Procesar e Importar CSV'}
          </button>

          {(archivoCsv || informe || errorGeneral) && (
            <button
              type="button"
              onClick={limpiar}
              className="btn-secondary"
              disabled={cargando}
            >
              Limpiar
            </button>
          )}
        </div>
      </form>

      {/* Error de estructura o conexión */}
      {errorGeneral && (
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#ef4444',
            fontWeight: '600',
            fontSize: '0.9rem',
          }}
        >
          {errorGeneral}
        </div>
      )}

      {/* Visualizador del informe por fila */}
      {informe && (
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Resumen numérico */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '1rem',
            }}
          >
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                Filas Leídas
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {informe.total_filas_leidas}
              </div>
            </div>

            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '600' }}>
                Filas Creadas
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#10b981' }}>
                {informe.total_exitosos}
              </div>
            </div>

            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: '600' }}>
                Filas Rechazadas
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#ef4444' }}>
                {informe.total_con_errores}
              </div>
            </div>
          </div>

          {/* Tabla de filas creadas */}
          <div>
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#10b981' }}>
              Filas Creadas ({informe.clientes_procesados?.length || 0})
            </h4>
            {informe.clientes_procesados?.length > 0 ? (
              <div
                style={{
                  overflowX: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Fila</th>
                      <th style={thStyle}>Correo</th>
                      <th style={thStyle}>Nombre</th>
                      <th style={thStyle}>Rol</th>
                      <th style={thStyle}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {informe.clientes_procesados.map((item, idx) => (
                      <tr key={idx}>
                        <td style={tdStyle}>#{item.fila}</td>
                        <td style={tdStyle}>{item.email}</td>
                        <td style={tdStyle}>{item.nombre}</td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              backgroundColor: 'var(--badge-bg)',
                              color: 'var(--badge-text)',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                            }}
                          >
                            {item.rol}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: '#10b981', fontWeight: '600' }}>
                          {item.estado}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                No se crearon registros nuevos.
              </p>
            )}
          </div>

          {/* Tabla de filas rechazadas */}
          <div>
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#ef4444' }}>
              Filas Rechazadas ({informe.reporte_errores?.length || 0})
            </h4>
            {informe.reporte_errores?.length > 0 ? (
              <div
                style={{
                  overflowX: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Fila</th>
                      <th style={thStyle}>Correo</th>
                      <th style={thStyle}>Motivo del Rechazo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {informe.reporte_errores.map((err, idx) => (
                      <tr key={idx}>
                        <td style={tdStyle}>#{err.fila}</td>
                        <td style={tdStyle}>{err.email}</td>
                        <td style={{ ...tdStyle, color: '#ef4444' }}>
                          {err.motivo || err.error}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                Todas las filas del archivo fueron válidas.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
