import { useState } from 'react'

// ─── Constantes ───────────────────────────────────────────────────────────────
const ESTADOS = ['ABIERTO', 'EN_SEGUIMIENTO', 'RESUELTO', 'CERRADO', 'DERIVADO']
const TIPOS_ACCION = ['CITACION', 'DERIVACION_ORIENTACION', 'ENTREVISTA', 'DERIVACION_PSICOLOGO']

const labelEstado = {
  ABIERTO:             'Abierto',
  EN_SEGUIMIENTO:      'En seguimiento',
  RESUELTO:            'Resuelto',
  CERRADO:             'Cerrado',
  DERIVADO:            'Derivado',
}
const labelAccion = {
  CITACION:               'Citación',
  DERIVACION_ORIENTACION: 'Derivación a orientación',
  ENTREVISTA:             'Entrevista',
  DERIVACION_PSICOLOGO:   'Derivación a psicólogo',
}
const labelTipo = {
  CONFLICTO:       'Conflicto',
  AGRESION_FISICA: 'Agresión Física',
  AGRESION_VERBAL: 'Agresión Verbal',
  ACOSO:           'Acoso',
  DANO_MATERIAL:   'Daño Material',
}
const labelGravedad = {
  LEVE:      'Leve',
  MODERADO:  'Moderado',
  GRAVE:     'Grave',
  MUY_GRAVE: 'Muy Grave',
}

// ─── Estilos por estado ───────────────────────────────────────────────────────
const styleEstado = {
  ABIERTO:        { bg: 'rgba(52,211,153,0.12)', color: '#065f46', border: '#2d7a4f' },
  EN_SEGUIMIENTO: { bg: 'rgba(251,191,36,0.15)', color: '#92400e', border: '#b45309' },
  RESUELTO:       { bg: 'rgba(79,142,247,0.12)', color: '#1e3a8a', border: '#3b82f6' },
  CERRADO:        { bg: 'rgba(107,31,42,0.10)',  color: '#6b1f2a', border: '#6b1f2a' },
  DERIVADO:       { bg: 'rgba(139,92,246,0.12)', color: '#4c1d95', border: '#7c3aed' },
}

function BadgeEstado({ estado }) {
  const s = styleEstado[estado] || styleEstado.ABIERTO
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      borderRadius: 20, padding: '3px 12px',
      fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {labelEstado[estado]}
    </span>
  )
}

// ─── Datos mock (reemplazar con llamada real a la API) ────────────────────────
const CASOS_MOCK = [
  {
    id: 101,
    titulo: 'Situación de acoso reiterado en 3°B',
    descripcion: 'Estudiante reportado por múltiples compañeros y docente jefa de curso por conducta de acoso sostenida.',
    estado: 'EN_SEGUIMIENTO',
    creadoEn: '2026-05-12T08:00:00Z',
    incidentes: [
      { id: 2, tipo: 'ACOSO', gravedad: 'MUY_GRAVE', fecha: '2026-05-12T08:15:00Z', descripcion: 'Situación de acoso reiterado reportada por docente.' },
      { id: 5, tipo: 'CONFLICTO', gravedad: 'MODERADO', fecha: '2026-05-20T11:00:00Z', descripcion: 'Conflicto entre grupos de estudiantes.' },
    ],
    acciones: [
      { tipo: 'CITACION', descripcion: 'Citación al apoderado del responsable.', fecha: '2026-05-14' },
      { tipo: 'DERIVACION_ORIENTACION', descripcion: 'Derivado a orientadora Sra. Pérez.', fecha: '2026-05-16' },
    ],
  },
  {
    id: 102,
    titulo: 'Pelea en patio entre alumnos de 3°B',
    descripcion: 'Pelea física durante el recreo. Ambos estudiantes presentaron lesiones menores.',
    estado: 'ABIERTO',
    creadoEn: '2026-05-10T10:30:00Z',
    incidentes: [
      { id: 1, tipo: 'AGRESION_FISICA', gravedad: 'GRAVE', fecha: '2026-05-10T10:30:00Z', descripcion: 'Pelea en el patio durante el recreo.' },
    ],
    acciones: [],
  },
  {
    id: 103,
    titulo: 'Daño a infraestructura sala 4°C',
    descripcion: 'Rotura intencional de ventana durante horario de clases.',
    estado: 'RESUELTO',
    creadoEn: '2026-05-18T09:45:00Z',
    incidentes: [
      { id: 4, tipo: 'DANO_MATERIAL', gravedad: 'LEVE', fecha: '2026-05-18T09:45:00Z', descripcion: 'Rotura de ventana en sala de clases 4°C.' },
    ],
    acciones: [
      { tipo: 'ENTREVISTA', descripcion: 'Entrevista con el estudiante y apoderado. Acuerdo de reparación.', fecha: '2026-05-19' },
    ],
  },
]

// ─── Componente principal ─────────────────────────────────────────────────────
export default function HistorialCasos() {
  const [filtros, setFiltros] = useState({ estado: '', texto: '', desde: '', hasta: '' })
  const [resultados, setResultados] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandido, setExpandido] = useState(null) // id del caso expandido
  const [editandoEstado, setEditandoEstado] = useState(null) // id del caso en edición
  const [nuevoEstado, setNuevoEstado] = useState('')

  const handleFiltroChange = e => setFiltros({ ...filtros, [e.target.name]: e.target.value })

  const handleBuscar = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setExpandido(null)
    try {
      // TODO: reemplazar con → await getCasos(filtros)
      await new Promise(r => setTimeout(r, 500))
      let datos = [...CASOS_MOCK]
      if (filtros.estado)  datos = datos.filter(c => c.estado === filtros.estado)
      if (filtros.texto) {
        const q = filtros.texto.toLowerCase()
        datos = datos.filter(c =>
          String(c.id).includes(q) ||
          c.titulo.toLowerCase().includes(q) ||
          c.descripcion.toLowerCase().includes(q)
        )
      }
      if (filtros.desde) datos = datos.filter(c => new Date(c.creadoEn) >= new Date(filtros.desde))
      if (filtros.hasta) datos = datos.filter(c => new Date(c.creadoEn) <= new Date(filtros.hasta + 'T23:59:59'))
      setResultados(datos)
    } catch (err) {
      setError('Error al buscar los casos')
    } finally {
      setLoading(false)
    }
  }

  const handleCambiarEstado = async (casoId) => {
    if (!nuevoEstado) return
    // TODO: await actualizarEstadoCaso(casoId, nuevoEstado)
    setResultados(resultados.map(c =>
      c.id === casoId ? { ...c, estado: nuevoEstado } : c
    ))
    setEditandoEstado(null)
    setNuevoEstado('')
  }

  const toggleExpandido = (id) => {
    setExpandido(expandido === id ? null : id)
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 26, marginBottom: 6 }}>
        Casos de Seguimiento
      </h2>
      <p style={{ color: 'var(--muted)', marginBottom: 28, fontSize: 14 }}>
        Consulte y filtre los casos registrados en el sistema. Puede ver sus incidentes, acciones y actualizar el estado.
      </p>

      {/* ── Formulario de filtros ─────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleBuscar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div className="form-group">
            <label>Buscar por ID, título o descripción</label>
            <input
              type="text" name="texto"
              placeholder="Ej: acoso, 3°B, #101..."
              value={filtros.texto} onChange={handleFiltroChange}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Filtros opcionales</p>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label>Estado del caso</label>
                <select name="estado" value={filtros.estado} onChange={handleFiltroChange}>
                  <option value="">Todos</option>
                  {ESTADOS.map(e => <option key={e} value={e}>{labelEstado[e]}</option>)}
                </select>
              </div>
              <div className="form-group" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Creado desde</label>
                <input type="date" name="desde" value={filtros.desde} onChange={handleFiltroChange} />
              </div>
              <div className="form-group">
                <label>Creado hasta</label>
                <input type="date" name="hasta" value={filtros.hasta} onChange={handleFiltroChange} />
              </div>
            </div>
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Buscando...' : '⌕ Buscar casos'}
          </button>
        </form>
      </div>

      {/* ── Resultados ───────────────────────────────────────────────────── */}
      {resultados !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Contador */}
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            {resultados.length === 0
              ? 'No se encontraron casos con los filtros aplicados.'
              : `${resultados.length} caso(s) encontrado(s)`
            }
          </p>

          {resultados.map(caso => (
            <div key={caso.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>

              {/* Cabecera del caso */}
              <div
                onClick={() => toggleExpandido(caso.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                  gap: 12, padding: '18px 22px', cursor: 'pointer',
                  borderBottom: expandido === caso.id ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>#{caso.id}</span>
                    <BadgeEstado estado={caso.estado} />
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {new Date(caso.creadoEn).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, lineHeight: 1.4 }}>
                    {caso.titulo}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                    {caso.descripcion}
                  </p>

                  {/* Resumen compacto */}
                  <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      🗂 {caso.incidentes.length} incidente(s)
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      📋 {caso.acciones.length} acción(es)
                    </span>
                  </div>
                </div>

                <span style={{ fontSize: 18, color: 'var(--muted)', flexShrink: 0, marginTop: 4 }}>
                  {expandido === caso.id ? '▲' : '▼'}
                </span>
              </div>

              {/* Detalle expandido */}
              {expandido === caso.id && (
                <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Incidentes asociados */}
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Incidentes asociados
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {caso.incidentes.map(inc => (
                        <div key={inc.id} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 12,
                          padding: '10px 14px', background: 'var(--surface2)',
                          borderRadius: 8, border: '1px solid var(--border)',
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>#{inc.id}</span>
                              <span className={`badge badge-${inc.gravedad.toLowerCase()}`}>
                                {labelGravedad[inc.gravedad]}
                              </span>
                              <span style={{
                                background: 'var(--surface)', color: 'var(--muted)',
                                padding: '3px 10px', borderRadius: 20, fontSize: 12,
                                border: '1px solid var(--border)',
                              }}>
                                {labelTipo[inc.tipo]}
                              </span>
                              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                                {new Date(inc.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                              {inc.descripcion}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Acciones de intervención */}
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Acciones de intervención
                    </p>
                    {caso.acciones.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>
                        Sin acciones registradas aún.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {caso.acciones.map((ac, i) => (
                          <div key={i} style={{
                            display: 'flex', gap: 12, alignItems: 'flex-start',
                            padding: '10px 14px', background: 'rgba(107,31,42,0.04)',
                            borderRadius: 8, border: '1px solid rgba(107,31,42,0.1)',
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{
                                  background: 'rgba(107,31,42,0.08)', color: 'var(--accent)',
                                  border: '1px solid rgba(107,31,42,0.2)',
                                  borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600,
                                }}>
                                  {labelAccion[ac.tipo]}
                                </span>
                                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                                  {new Date(ac.fecha + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                                {ac.descripcion}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actualizar estado */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    paddingTop: 16, borderTop: '1px solid var(--border)',
                  }}>
                    {editandoEstado === caso.id ? (
                      <>
                        <select
                          value={nuevoEstado}
                          onChange={e => setNuevoEstado(e.target.value)}
                          style={{ maxWidth: 200, padding: '8px 12px', fontSize: 13 }}
                        >
                          <option value="">Seleccionar estado...</option>
                          {ESTADOS.filter(e => e !== caso.estado).map(e => (
                            <option key={e} value={e}>{labelEstado[e]}</option>
                          ))}
                        </select>
                        <button
                          className="btn-primary"
                          onClick={() => handleCambiarEstado(caso.id)}
                          disabled={!nuevoEstado}
                          style={{ fontSize: 13, padding: '8px 16px' }}
                        >
                          Confirmar
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => { setEditandoEstado(null); setNuevoEstado('') }}
                          style={{ fontSize: 13, padding: '8px 16px' }}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn-secondary"
                        onClick={() => { setEditandoEstado(caso.id); setNuevoEstado('') }}
                        style={{ fontSize: 13, padding: '8px 16px' }}
                      >
                        Cambiar estado
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
