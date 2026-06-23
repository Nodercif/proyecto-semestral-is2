import { useState } from 'react'

// ─── Constantes ──────────────────────────────────────────────────────────────
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
  CITACION:                'Citación',
  DERIVACION_ORIENTACION:  'Derivación a orientación',
  ENTREVISTA:              'Entrevista',
  DERIVACION_PSICOLOGO:    'Derivación a psicólogo',
}
const labelTipo = {
  CONFLICTO:        'Conflicto',
  AGRESION_FISICA:  'Agresión Física',
  AGRESION_VERBAL:  'Agresión Verbal',
  ACOSO:            'Acoso',
  DANO_MATERIAL:    'Daño Material',
}
const labelGravedad = {
  LEVE:      'Leve',
  MODERADO:  'Moderado',
  GRAVE:     'Grave',
  MUY_GRAVE: 'Muy Grave',
}

// ─── Datos de incidentes de ejemplo (reemplazar con llamada real a la API) ───
const INCIDENTES_MOCK = [
  { id: 1, fecha: '2026-05-10T10:30:00Z', tipo: 'AGRESION_FISICA',  gravedad: 'GRAVE',    descripcion: 'Pelea en el patio durante el recreo entre dos alumnos de 3°B.' },
  { id: 2, fecha: '2026-05-12T08:15:00Z', tipo: 'ACOSO',            gravedad: 'MUY_GRAVE', descripcion: 'Situación de acoso reiterado reportada por docente jefa de curso.' },
  { id: 3, fecha: '2026-05-14T14:00:00Z', tipo: 'AGRESION_VERBAL',  gravedad: 'MODERADO', descripcion: 'Insultos y amenazas verbales entre estudiantes de 2°A.' },
  { id: 4, fecha: '2026-05-18T09:45:00Z', tipo: 'DANO_MATERIAL',    gravedad: 'LEVE',     descripcion: 'Rotura de ventana en sala de clases 4°C.' },
  { id: 5, fecha: '2026-05-20T11:00:00Z', tipo: 'CONFLICTO',        gravedad: 'MODERADO', descripcion: 'Conflicto entre grupos de estudiantes en los pasillos.' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const badgeEstado = {
  ABIERTO:        { bg: 'rgba(52,211,153,0.12)', color: '#065f46', border: '#2d7a4f' },
  EN_SEGUIMIENTO: { bg: 'rgba(251,191,36,0.15)', color: '#92400e', border: '#b45309' },
  RESUELTO:       { bg: 'rgba(79,142,247,0.12)', color: '#1e3a8a', border: '#3b82f6' },
  CERRADO:        { bg: 'rgba(107,31,42,0.1)',   color: '#6b1f2a', border: '#6b1f2a' },
  DERIVADO:       { bg: 'rgba(139,92,246,0.12)', color: '#4c1d95', border: '#7c3aed' },
}

function BadgeEstado({ estado }) {
  const s = badgeEstado[estado] || badgeEstado.ABIERTO
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      borderRadius: 20, padding: '3px 12px',
      fontSize: 12, fontWeight: 600,
    }}>
      {labelEstado[estado]}
    </span>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function CrearCaso() {
  // Paso 1 — datos del caso
  const [form, setForm] = useState({ titulo: '', descripcion: '', estado: 'ABIERTO' })

  // Paso 2 — incidentes
  const [busqueda, setBusqueda] = useState('')
  const [incidentesAsociados, setIncidentesAsociados] = useState([])

  // Paso 3 — acciones
  const [accion, setAccion]       = useState({ tipo: '', descripcion: '', fecha: '' })
  const [acciones, setAcciones]   = useState([])

  const [casoCreado, setCasoCreado]   = useState(null)
  const [paso, setPaso]               = useState(1)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [exito, setExito]             = useState('')

  const handleFormChange  = e => setForm({ ...form, [e.target.name]: e.target.value })
  const handleAccionChange = e => setAccion({ ...accion, [e.target.name]: e.target.value })

  // Filtrar incidentes disponibles según búsqueda y ya asociados
  const incidentesFiltrados = INCIDENTES_MOCK.filter(inc => {
    const yaAsociado = incidentesAsociados.some(a => a.id === inc.id)
    if (yaAsociado) return false
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (
      String(inc.id).includes(q) ||
      inc.descripcion.toLowerCase().includes(q) ||
      labelTipo[inc.tipo]?.toLowerCase().includes(q) ||
      labelGravedad[inc.gravedad]?.toLowerCase().includes(q)
    )
  })

  // ── Paso 1: crear caso ──────────────────────────────────────────────────────
  const handleCrearCaso = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // TODO: reemplazar con llamada real → await crearCaso(form)
      await new Promise(r => setTimeout(r, 600))
      const mockCaso = { id: Math.floor(Math.random() * 900) + 100, ...form }
      setCasoCreado(mockCaso)
      setPaso(2)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el caso')
    } finally {
      setLoading(false)
    }
  }

  // ── Paso 2: asociar incidente ───────────────────────────────────────────────
  const handleAsociar = (inc) => {
    // TODO: await asociarIncidenteACaso(casoCreado.id, inc.id)
    setIncidentesAsociados([...incidentesAsociados, inc])
  }
  const handleDesasociar = (id) => {
    // TODO: await desasociarIncidente(casoCreado.id, id)
    setIncidentesAsociados(incidentesAsociados.filter(i => i.id !== id))
  }

  // ── Paso 3: agregar acción ──────────────────────────────────────────────────
  const handleAgregarAccion = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // TODO: await registrarAccion(casoCreado.id, accion)
      await new Promise(r => setTimeout(r, 400))
      setAcciones([...acciones, { ...accion, id: Date.now() }])
      setAccion({ tipo: '', descripcion: '', fecha: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'Error al agregar acción')
    } finally {
      setLoading(false)
    }
  }

  // ── Finalizar ────────────────────────────────────────────────────────────────
  const handleFinalizar = () => {
    setExito(
      `Caso #${casoCreado.id} creado con ${incidentesAsociados.length} incidente(s) y ${acciones.length} acción(es).`
    )
    setForm({ titulo: '', descripcion: '', estado: 'ABIERTO' })
    setIncidentesAsociados([])
    setAcciones([])
    setCasoCreado(null)
    setBusqueda('')
    setPaso(1)
    setTimeout(() => setExito(''), 6000)
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  const pasos = ['Datos del caso', 'Asociar incidentes', 'Acciones de intervención']

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 26, marginBottom: 6 }}>
        Crear Caso de Seguimiento
      </h2>
      <p style={{ color: 'var(--muted)', marginBottom: 28, fontSize: 14 }}>
        Agrupe uno o más incidentes en un caso para realizar su seguimiento y registrar acciones de intervención.
      </p>

      {/* Mensaje de éxito */}
      {exito && (
        <div className="card" style={{ borderColor: 'var(--success)', marginBottom: 20 }}>
          <p className="success-msg" style={{ fontSize: 14 }}>✓ {exito}</p>
        </div>
      )}

      {/* Indicador de pasos */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {pasos.map((label, i) => {
          const activo    = paso === i + 1
          const completado = paso > i + 1
          return (
            <div key={i} style={{
              flex: 1, padding: '8px 12px', borderRadius: 8,
              fontSize: 12, fontWeight: 500, textAlign: 'center',
              background: activo ? 'rgba(107,31,42,0.1)' : completado ? 'rgba(45,122,79,0.08)' : 'var(--surface)',
              color: activo ? 'var(--accent)' : completado ? 'var(--success)' : 'var(--muted)',
              border: `1.5px solid ${activo ? 'var(--accent)' : completado ? 'var(--success)' : 'var(--border)'}`,
            }}>
              {i + 1}. {label}{completado ? ' ✓' : ''}
            </div>
          )
        })}
      </div>

      {/* ─── PASO 1: Datos del caso ─────────────────────────────────────────── */}
      {paso === 1 && (
        <div className="card">
          <form onSubmit={handleCrearCaso} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div className="form-group">
              <label>Título del caso *</label>
              <input
                type="text" name="titulo" required
                placeholder="Ej: Situación de acoso entre estudiantes de 3°B"
                value={form.titulo} onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label>Descripción *</label>
              <textarea
                name="descripcion" required rows={4}
                placeholder="Describa brevemente el contexto general del caso..."
                value={form.descripcion} onChange={handleFormChange}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group" style={{ maxWidth: 260 }}>
              <label>Estado inicial *</label>
              <select name="estado" value={form.estado} onChange={handleFormChange}>
                {ESTADOS.map(e => (
                  <option key={e} value={e}>{labelEstado[e]}</option>
                ))}
              </select>
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Continuar → Asociar incidentes'}
            </button>
          </form>
        </div>
      )}

      {/* ─── PASO 2: Asociar incidentes ─────────────────────────────────────── */}
      {paso === 2 && casoCreado && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Resumen del caso creado */}
          <div className="card" style={{ borderColor: 'rgba(107,31,42,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>Caso creado</p>
                <p style={{ fontSize: 15, fontWeight: 600 }}>#{casoCreado.id} — {casoCreado.titulo}</p>
              </div>
              <BadgeEstado estado={casoCreado.estado} />
            </div>
          </div>

          {/* Buscador de incidentes */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
              Buscar incidentes existentes
            </h3>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Buscar por ID, descripción, tipo o gravedad..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>

            {incidentesFiltrados.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>
                {busqueda ? 'No se encontraron incidentes con ese criterio.' : 'No hay más incidentes disponibles.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {incidentesFiltrados.map(inc => (
                  <div key={inc.id} style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    gap: 12, padding: '12px 14px',
                    background: 'var(--surface2)', borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
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
                      <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {inc.descripcion}
                      </p>
                    </div>
                    <button
                      className="btn-secondary"
                      onClick={() => handleAsociar(inc)}
                      style={{ fontSize: 12, padding: '6px 14px', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      + Asociar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incidentes ya asociados */}
          {incidentesAsociados.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 12 }}>
                Incidentes asociados al caso ({incidentesAsociados.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {incidentesAsociados.map(inc => (
                  <div key={inc.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 12, padding: '10px 14px',
                    background: 'rgba(45,122,79,0.06)', borderRadius: 8,
                    border: '1px solid rgba(45,122,79,0.2)',
                  }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>#{inc.id}</span>
                      <span className={`badge badge-${inc.gravedad.toLowerCase()}`}>
                        {labelGravedad[inc.gravedad]}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text)' }}>
                        {labelTipo[inc.tipo]}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDesasociar(inc.id)}
                      style={{
                        background: 'transparent', color: 'var(--danger)',
                        border: '1px solid var(--danger)', borderRadius: 6,
                        fontSize: 12, padding: '4px 10px', flexShrink: 0,
                      }}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {incidentesAsociados.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--warning)', textAlign: 'center' }}>
              Asocie al menos un incidente antes de continuar.
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn-primary"
              onClick={() => setPaso(3)}
              disabled={incidentesAsociados.length === 0}
              style={{ padding: '11px 28px' }}
            >
              Continuar → Registrar acciones
            </button>
          </div>
        </div>
      )}

      {/* ─── PASO 3: Acciones de intervención ───────────────────────────────── */}
      {paso === 3 && casoCreado && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Resumen del caso */}
          <div className="card" style={{ borderColor: 'rgba(107,31,42,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>Caso #{casoCreado.id}</p>
                <p style={{ fontSize: 15, fontWeight: 600 }}>{casoCreado.titulo}</p>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                  {incidentesAsociados.length} incidente(s) asociado(s)
                </p>
              </div>
              <BadgeEstado estado={casoCreado.estado} />
            </div>
          </div>

          {/* Formulario de acción */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
              Registrar acción de intervención
            </h3>
            <form onSubmit={handleAgregarAccion} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de acción *</label>
                  <select name="tipo" required value={accion.tipo} onChange={handleAccionChange}>
                    <option value="">Seleccionar...</option>
                    {TIPOS_ACCION.map(t => (
                      <option key={t} value={t}>{labelAccion[t]}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Fecha *</label>
                  <input type="date" name="fecha" required value={accion.fecha} onChange={handleAccionChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Descripción de la acción *</label>
                <textarea
                  name="descripcion" required rows={3}
                  placeholder="Ej: Se citó al apoderado del estudiante para el día lunes..."
                  value={accion.descripcion} onChange={handleAccionChange}
                  style={{ resize: 'vertical' }}
                />
              </div>
              {error && <p className="error-msg">{error}</p>}
              <button className="btn-secondary" type="submit" disabled={loading}>
                {loading ? 'Registrando...' : '+ Registrar acción'}
              </button>
            </form>
          </div>

          {/* Lista de acciones registradas */}
          {acciones.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 12 }}>
                Acciones registradas ({acciones.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {acciones.map((ac, i) => (
                  <div key={ac.id} style={{
                    padding: '12px 14px',
                    background: 'var(--surface2)', borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{
                        background: 'rgba(107,31,42,0.08)', color: 'var(--accent)',
                        border: '1px solid rgba(107,31,42,0.2)',
                        borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                      }}>
                        {labelAccion[ac.tipo]}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {new Date(ac.fecha + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{ac.descripcion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              {acciones.length === 0 ? 'Puede finalizar sin acciones o registrar al menos una.' : ''}
            </p>
            <button
              className="btn-primary"
              onClick={handleFinalizar}
              style={{ padding: '11px 28px' }}
            >
              Finalizar registro
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
