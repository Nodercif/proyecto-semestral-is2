import { useState } from 'react'
import { getHistorialEstudiante, getHistorialCurso } from '../services/api'

const labelTipo = { CONFLICTO: 'Conflicto', AGRESION_FISICA: 'Agresión Física', AGRESION_VERBAL: 'Agresión Verbal', ACOSO: 'Acoso', DANO_MATERIAL: 'Daño Material' }
const labelGravedad = { LEVE: 'Leve', MODERADO: 'Moderado', GRAVE: 'Grave', MUY_GRAVE: 'Muy Grave' }
const labelRol = { AFECTADO: 'Afectado', RESPONSABLE: 'Responsable', TESTIGO: 'Testigo', INTERVINIENTE: 'Interviniente' }

const cursos = [
  '1° Básico A', '1° Básico B', '1° Básico C',
  '2° Básico A', '2° Básico B', '2° Básico C',
  '3° Básico A', '3° Básico B', '3° Básico C',
  '4° Básico A', '4° Básico B', '4° Básico C',
  '5° Básico A', '5° Básico B', '5° Básico C',
  '6° Básico A', '6° Básico B', '6° Básico C',
  '7° Básico A', '7° Básico B', '7° Básico C',
  '8° Básico A', '8° Básico B', '8° Básico C',
  '1° Medio A', '1° Medio B', '1° Medio C',
  '2° Medio A', '2° Medio B', '2° Medio C',
  '3° Medio A', '3° Medio B', '3° Medio C',
  '4° Medio A', '4° Medio B', '4° Medio C',
]

export default function HistorialEstudiante() {
  const [modoBusqueda, setModoBusqueda] = useState('id') // 'id' | 'curso'
  const [estudianteId, setEstudianteId] = useState('')
  const [cursoSeleccionado, setCursoSeleccionado] = useState('')
  const [filtros, setFiltros] = useState({ tipo: '', gravedad: '', rolInvolucrado: '', desde: '', hasta: '' })
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFiltroChange = e => setFiltros({ ...filtros, [e.target.name]: e.target.value })

  const handleBuscar = async (e) => {
    e.preventDefault()
    if (modoBusqueda === 'id' && !estudianteId) return
    if (modoBusqueda === 'curso' && !cursoSeleccionado) return
    setError('')
    setLoading(true)
    setResultado(null)
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== ''))
      let res
      if (modoBusqueda === 'id') {
        res = await getHistorialEstudiante(estudianteId, params)
      } else {
        res = await getHistorialCurso(cursoSeleccionado, params)
      }
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
        Consulte el historial por estudiante o por curso. Puede filtrar por tipo, gravedad, rol o rango de fechas.
      </p>

      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleBuscar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Toggle modo búsqueda */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['id', 'curso'].map(modo => (
              <button
                key={modo}
                type="button"
                onClick={() => { setModoBusqueda(modo); setResultado(null); setError('') }}
                style={{
                  padding: '6px 18px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                  border: '1px solid var(--border)',
                  background: modoBusqueda === modo ? 'var(--accent)' : 'var(--surface2)',
                  color: modoBusqueda === modo ? '#fff' : 'var(--muted)',
                  fontWeight: modoBusqueda === modo ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {modo === 'id' ? 'Por estudiante' : 'Por curso'}
              </button>
            ))}
          </div>

          {/* Campo principal según modo */}
          {modoBusqueda === 'id' ? (
            <div className="form-group">
              <label>ID del estudiante *</label>
              <input
                type="number" min={1} placeholder="Ej: 1"
                value={estudianteId} onChange={e => setEstudianteId(e.target.value)}
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Curso *</label>
              <select value={cursoSeleccionado} onChange={e => setCursoSeleccionado(e.target.value)}>
                <option value="">Seleccione un curso</option>
                {cursos.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filtros opcionales */}
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

            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label>Rol involucrado</label>
                <select name="rolInvolucrado" value={filtros.rolInvolucrado} onChange={handleFiltroChange}>
                  <option value="">Todos</option>
                  {Object.entries(labelRol).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              {/* Celda vacía para mantener el grid de 2 columnas */}
              <div className="form-group" />
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
          <div className="card" style={{ borderColor: 'rgba(79,142,247,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {modoBusqueda === 'id' ? (
                  <>
                    <p style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-head)' }}>
                      {resultado.estudiante.nombres} {resultado.estudiante.apellidos}
                    </p>
                    <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                      Curso: {resultado.estudiante.curso} · ID: {resultado.estudiante.id}
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-head)' }}>
                    {cursoSeleccionado}
                  </p>
                )}
              </div>
              <div style={{
                background: resultado.totalIncidentes >= 2 ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.1)',
                color: resultado.totalIncidentes >= 2 ? 'var(--danger)' : 'var(--success)',
                border: `1px solid ${resultado.totalIncidentes >= 2 ? 'var(--danger)' : 'var(--success)'}`,
                borderRadius: 8, padding: '8px 14px', textAlign: 'center'
              }}>
                <p style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{resultado.totalIncidentes}</p>
                <p style={{ fontSize: 11 }}>incidente(s)</p>
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
                      {labelRol[item.rol]}
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

                {/* En modo curso, mostrar a qué estudiante pertenece cada incidente */}
                {modoBusqueda === 'curso' && item.estudiante && (
                  <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 8, fontWeight: 500 }}>
                    Estudiante: {item.estudiante.nombres} {item.estudiante.apellidos}
                  </p>
                )}

                {item.incidente.registradoPor && (
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
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