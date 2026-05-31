import { useState } from 'react'
import { getHistorialEstudiante } from '../services/api'

const labelTipo = { CONFLICTO: 'Conflicto', AGRESION_FISICA: 'Agresión Física', AGRESION_VERBAL: 'Agresión Verbal', ACOSO: 'Acoso', DANO_MATERIAL: 'Daño Material' }
const labelGravedad = { LEVE: 'Leve', MODERADO: 'Moderado', GRAVE: 'Grave', MUY_GRAVE: 'Muy Grave' }

export default function HistorialEstudiante() {
  const [estudianteId, setEstudianteId] = useState('')
  const [filtros, setFiltros]           = useState({ tipo: '', gravedad: '', desde: '', hasta: '' })
  const [resultado, setResultado]       = useState(null)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  const handleFiltroChange = e => setFiltros({ ...filtros, [e.target.name]: e.target.value })

  const handleBuscar = async (e) => {
    e.preventDefault()
    if (!estudianteId) return
    setError('')
    setLoading(true)
    setResultado(null)
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== ''))
      const res = await getHistorialEstudiante(estudianteId, params)
      setResultado(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al buscar el historial')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 26, marginBottom: 6 }}>
        Historial de Incidentes
      </h2>
      <p style={{ color: 'var(--muted)', marginBottom: 28, fontSize: 14 }}>
        Consulte el historial de un estudiante por su ID. Puede filtrar por tipo, gravedad o rango de fechas.
      </p>

      {/* Formulario de búsqueda */}
      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleBuscar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label>ID del estudiante *</label>
            <input
              type="number" required min={1} placeholder="Ej: 1"
              value={estudianteId} onChange={e => setEstudianteId(e.target.value)}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Filtros opcionales</p>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label>Tipo de incidente</label>
                <select name="tipo" value={filtros.tipo} onChange={handleFiltroChange}>
                  <option value="">Todos</option>
                  {Object.entries(labelTipo).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Gravedad</label>
                <select name="gravedad" value={filtros.gravedad} onChange={handleFiltroChange}>
                  <option value="">Todas</option>
                  {Object.entries(labelGravedad).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Desde</label>
                <input type="date" name="desde" value={filtros.desde} onChange={handleFiltroChange} />
              </div>
              <div className="form-group">
                <label>Hasta</label>
                <input type="date" name="hasta" value={filtros.hasta} onChange={handleFiltroChange} />
              </div>
            </div>
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Buscando...' : '⌕ Buscar historial'}
          </button>
        </form>
      </div>

      {/* Resultados */}
      {resultado && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Info del estudiante */}
          <div className="card" style={{ borderColor: 'rgba(79,142,247,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-head)' }}>
                  {resultado.estudiante.nombres} {resultado.estudiante.apellidos}
                </p>
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                  Curso: {resultado.estudiante.curso} · ID: {resultado.estudiante.id}
                </p>
              </div>
              <div style={{
                background: resultado.totalIncidentes >= 2 ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.1)',
                color: resultado.totalIncidentes >= 2 ? 'var(--danger)' : 'var(--success)',
                border: `1px solid ${resultado.totalIncidentes >= 2 ? 'var(--danger)' : 'var(--success)'}`,
                borderRadius: 8, padding: '8px 14px', textAlign: 'center'
              }}>
                <p style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{resultado.totalIncidentes}</p>
                <p style={{ fontSize: 11 }}>incidente(s)</p>
                {resultado.totalIncidentes >= 2 && (
                  <p style={{ fontSize: 10, marginTop: 4 }}>⚠ Reincidencia</p>
                )}
              </div>
            </div>
          </div>

          {resultado.incidentes.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: 'var(--muted)' }}>No se encontraron incidentes con los filtros aplicados.</p>
            </div>
          ) : (
            resultado.incidentes.map((item, i) => (
              <div key={i} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className={`badge badge-${item.incidente.gravedad.toLowerCase()}`}>
                      {labelGravedad[item.incidente.gravedad]}
                    </span>
                    <span style={{
                      background: 'var(--surface2)', color: 'var(--muted)',
                      padding: '3px 10px', borderRadius: 20, fontSize: 12
                    }}>
                      {labelTipo[item.incidente.tipo]}
                    </span>
                    <span className={`badge badge-${item.rol.toLowerCase()}`}>
                      {item.rol}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {new Date(item.incidente.fecha).toLocaleDateString('es-CL', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </span>
                </div>

                <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: item.observacion ? 10 : 0 }}>
                  {item.incidente.descripcion}
                </p>

                {item.observacion && (
                  <p style={{
                    fontSize: 13, color: 'var(--muted)', fontStyle: 'italic',
                    background: 'var(--surface2)', padding: '8px 12px', borderRadius: 6, marginTop: 8
                  }}>
                    Obs: {item.observacion}
                  </p>
                )}

                {item.incidente.registradoPor && (
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>
                    Registrado por: {item.incidente.registradoPor.nombres} {item.incidente.registradoPor.apellidos}
                    · {item.incidente.registradoPor.cargo.replace('_', ' ')}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
