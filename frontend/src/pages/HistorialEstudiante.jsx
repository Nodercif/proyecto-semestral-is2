import { useState, useEffect } from 'react'
import {
  getHistorialEstudiante, getHistorialCurso, eliminarIncidente,
  getIncidente, editarIncidente, getEstudiantes,
  getIncidentes,
} from '../services/api'
import { CURSOS } from '../constants/cursos'

const TIPOS = ['CONFLICTO', 'AGRESION_FISICA', 'AGRESION_VERBAL', 'ACOSO', 'DANO_MATERIAL']
const GRAVEDADES = ['LEVE', 'MODERADO', 'GRAVE', 'MUY_GRAVE']
const ROLES_INV = ['AFECTADO', 'RESPONSABLE', 'TESTIGO', 'INTERVINIENTE']
const labelTipo = { CONFLICTO: 'Conflicto', AGRESION_FISICA: 'Agresión Física', AGRESION_VERBAL: 'Agresión Verbal', ACOSO: 'Acoso', DANO_MATERIAL: 'Daño Material' }
const labelGravedad = { LEVE: 'Leve', MODERADO: 'Moderado', GRAVE: 'Grave', MUY_GRAVE: 'Muy Grave' }
const labelRol = { AFECTADO: 'Afectado', RESPONSABLE: 'Responsable', TESTIGO: 'Testigo', INTERVINIENTE: 'Interviniente' }

const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '')
const toTimeInput = (iso) => (iso ? new Date(iso).toISOString().slice(11, 16) : '')

export default function HistorialEstudiante() {
  const [modoBusqueda, setModoBusqueda] = useState('id') // 'id' | 'curso'
  const [estudianteInput, setEstudianteInput] = useState('') // texto ingresado por usuario (puede ser ID o nombre)
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null) // objeto estudiante seleccionado después de búsqueda
  const [cursoSeleccionado, setCursoSeleccionado] = useState('')
  const [filtros, setFiltros] = useState({ tipo: '', gravedad: '', rolInvolucrado: '', desde: '', hasta: '' })
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  // Estado para lista de estudiantes encontrados por nombre
  const [estudiantesEncontrados, setEstudiantesEncontrados] = useState([])
  const [buscandoEstudiantes, setBuscandoEstudiantes] = useState(false)

  // Edición de incidente
  const [editandoId, setEditandoId] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [formIncidente, setFormIncidente] = useState({ fecha: '', hora: '', descripcion: '', tipo: '', gravedad: '' })
  const [involucradosEdit, setInvolucradosEdit] = useState([])
  const [guardandoIncidente, setGuardandoIncidente] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState('')

  // Buscador de estudiante para agregar nuevo involucrado (dentro de edición)
  const [busquedaNombreEdit, setBusquedaNombreEdit] = useState('')
  const [busquedaCursoEdit, setBusquedaCursoEdit] = useState('')
  const [resultadosBusquedaEdit, setResultadosBusquedaEdit] = useState([])
  const [buscandoEdit, setBuscandoEdit] = useState(false)
  const [rolNuevoInv, setRolNuevoInv] = useState('')

  const handleFiltroChange = e => setFiltros({ ...filtros, [e.target.name]: e.target.value })

  const handleEliminarIncidente = async (incidenteId) => {
    setEliminando(true)
    setError('')
    try {
      await eliminarIncidente(incidenteId)
      setResultado({
        ...resultado,
        incidentes: resultado.incidentes.filter(item => item.incidente.id !== incidenteId),
        totalIncidentes: resultado.totalIncidentes - 1,
      })
      setConfirmandoEliminar(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar el incidente')
    } finally {
      setEliminando(false)
    }
  }

  // Función para cargar historial de un estudiante dado su ID
  const cargarHistorialEstudiante = async (id) => {
    setLoading(true)
    setError('')
    setResultado(null)
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== ''))
      const res = await getHistorialEstudiante(id, params)
      setResultado(res.data)
      // Resetear selección de estudiantes encontrados
      setEstudiantesEncontrados([])
      setEstudianteSeleccionado(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al buscar el historial')
    } finally {
      setLoading(false)
    }
  }

  // Función principal de búsqueda
  const handleBuscar = async (e) => {
    e.preventDefault()

    // Caso 1: modo curso
    if (modoBusqueda === 'curso') {
      if (!cursoSeleccionado) {
        setError('Seleccione un curso para buscar.')
        return
      }
      setError('')
      setLoading(true)
      setResultado(null)
      try {
        const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== ''))
        const res = await getHistorialCurso(cursoSeleccionado, params)
        setResultado(res.data)
      } catch (err) {
        setError(err.response?.data?.error || 'Error al buscar el historial')
      } finally {
        setLoading(false)
      }
      return
    }

    // Caso 2: modo estudiante (ID o nombre)
    if (!estudianteInput.trim()) {
      setError('Ingrese el ID o nombre del estudiante (o déjelo vacío para ver todos).')
      return
    }

    // Si el estudianteInput es un número, intentar buscar por ID directamente
    const idNumerico = parseInt(estudianteInput.trim(), 10)
    if (!isNaN(idNumerico) && idNumerico > 0) {
      // Intentar cargar historial por ID
      try {
        await cargarHistorialEstudiante(idNumerico)
      } catch (err) {
        setError('No se encontró un estudiante con ese ID.')
      }
      return
    }

    // Si no es número, buscar estudiantes por nombre
    setBuscandoEstudiantes(true)
    setError('')
    setEstudiantesEncontrados([])
    setEstudianteSeleccionado(null)
    try {
      const res = await getEstudiantes({ nombre: estudianteInput.trim() })
      const estudiantes = res.data.data || []
      if (estudiantes.length === 0) {
        setError(`No se encontraron estudiantes con el nombre "${estudianteInput.trim()}".`)
        setEstudiantesEncontrados([])
      } else if (estudiantes.length === 1) {
        // Solo uno, cargar directamente
        await cargarHistorialEstudiante(estudiantes[0].id)
      } else {
        // Múltiples, mostrar lista para seleccionar
        setEstudiantesEncontrados(estudiantes)
        setError('Se encontraron varios estudiantes. Seleccione uno de la lista:')
      }
    } catch (err) {
      setError('Error al buscar estudiantes por nombre.')
    } finally {
      setBuscandoEstudiantes(false)
    }
  }

  // Cuando se selecciona un estudiante de la lista de resultados
  const seleccionarEstudiante = async (est) => {
    setEstudianteSeleccionado(est)
    await cargarHistorialEstudiante(est.id)
  }

  // ── Iniciar edición: carga el detalle completo (con involucrados) ───────────
  const handleIniciarEdicion = async (incidenteId) => {
    setCargandoDetalle(true)
    setErrorEdicion('')
    setEditandoId(incidenteId)
    try {
      const res = await getIncidente(incidenteId)
      const inc = res.data
      setFormIncidente({
        fecha: toDateInput(inc.fecha),
        hora: toTimeInput(inc.fecha),
        descripcion: inc.descripcion,
        tipo: inc.tipo,
        gravedad: inc.gravedad,
      })
      setInvolucradosEdit(
        (inc.involucrados || []).map(inv => ({
          id: inv.id,
          estudianteId: inv.estudianteId,
          estudiante: inv.estudiante,
          rol: inv.rol,
          observacion: inv.observacion || '',
        }))
      )
    } catch (err) {
      setErrorEdicion('Error al cargar el detalle del incidente')
    } finally {
      setCargandoDetalle(false)
    }
  }

  const handleCancelarEdicion = () => {
    setEditandoId(null)
    setErrorEdicion('')
    setBusquedaNombreEdit('')
    setBusquedaCursoEdit('')
    setResultadosBusquedaEdit([])
    setRolNuevoInv('')
  }

  const handleFormIncidenteChange = e => setFormIncidente({ ...formIncidente, [e.target.name]: e.target.value })

  const buscarEstudiantesEdit = async (nombre, curso) => {
    if (!nombre && !curso) {
      setResultadosBusquedaEdit([])
      return
    }
    setBuscandoEdit(true)
    try {
      const params = {}
      if (nombre) params.nombre = nombre
      if (curso) params.curso = curso
      const res = await getEstudiantes(params)
      setResultadosBusquedaEdit(res.data.data || [])
    } catch (err) {
      setResultadosBusquedaEdit([])
    } finally {
      setBuscandoEdit(false)
    }
  }

  const handleAgregarInvolucradoEdit = (estudiante) => {
    if (!rolNuevoInv) {
      setErrorEdicion('Seleccione un rol antes de agregar al estudiante.')
      return
    }
    if (involucradosEdit.some(inv => inv.estudianteId === estudiante.id && inv.rol === rolNuevoInv)) {
      setErrorEdicion('Este estudiante ya tiene ese rol en el incidente.')
      return
    }
    setInvolucradosEdit([
      ...involucradosEdit,
      { id: undefined, estudianteId: estudiante.id, estudiante, rol: rolNuevoInv, observacion: '' },
    ])
    setBusquedaNombreEdit('')
    setBusquedaCursoEdit('')
    setResultadosBusquedaEdit([])
    setRolNuevoInv('')
    setErrorEdicion('')
  }

  const handleQuitarInvolucradoEdit = (idx) => {
    setInvolucradosEdit(involucradosEdit.filter((_, i) => i !== idx))
  }

  const handleCambiarRolInvolucradoEdit = (idx, nuevoRol) => {
    setInvolucradosEdit(involucradosEdit.map((inv, i) => (i === idx ? { ...inv, rol: nuevoRol } : inv)))
  }

  const handleCambiarObservacionEdit = (idx, obs) => {
    setInvolucradosEdit(involucradosEdit.map((inv, i) => (i === idx ? { ...inv, observacion: obs } : inv)))
  }

  const handleGuardarEdicion = async (e) => {
    e.preventDefault()
    setGuardandoIncidente(true)
    setErrorEdicion('')
    try {
      const fechaHora = new Date(`${formIncidente.fecha}T${formIncidente.hora || '00:00'}`)
      await editarIncidente(editandoId, {
        fecha: fechaHora.toISOString(),
        descripcion: formIncidente.descripcion,
        tipo: formIncidente.tipo,
        gravedad: formIncidente.gravedad,
        involucrados: involucradosEdit.map(inv => ({
          id: inv.id,
          estudianteId: inv.estudianteId,
          rol: inv.rol,
          observacion: inv.observacion || undefined,
        })),
      })
      // Refrescar resultados re-corriendo la búsqueda activa
      await handleBuscar({ preventDefault: () => {} })
      setEditandoId(null)
    } catch (err) {
      setErrorEdicion(err.response?.data?.errores?.join(' ') || err.response?.data?.error || 'Error al guardar los cambios')
    } finally {
      setGuardandoIncidente(false)
    }
  }

  // Calcular reincidencia
  const calcularReincidencia = (incidentes) => {
    if (!incidentes || incidentes.length === 0) return null
    const responsables = incidentes.filter(item => item.rol === 'RESPONSABLE')
    if (responsables.length >= 2) {
      return {
        total: responsables.length,
        incidentes: responsables
      }
    }
    return null
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 26, marginBottom: 6 }}>
        Historial de Incidentes
      </h2>
      <p style={{ color: 'var(--muted)', marginBottom: 28, fontSize: 14 }}>
        Consulte el historial por estudiante (nombre o ID) o por curso. Puede filtrar por tipo, gravedad, rol o rango de fechas.
      </p>

      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleBuscar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Toggle modo búsqueda */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['id', 'curso'].map(modo => (
              <button
                key={modo}
                type="button"
                onClick={() => { setModoBusqueda(modo); setResultado(null); setError(''); setEstudiantesEncontrados([]); setEstudianteSeleccionado(null); }}
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
              <label>Nombre o ID del estudiante (opcional)</label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez o 1 (dejar vacío para todos)"
                value={estudianteInput}
                onChange={e => { setEstudianteInput(e.target.value); setEstudiantesEncontrados([]); setEstudianteSeleccionado(null); }}
              />
              {buscandoEstudiantes && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Buscando estudiantes...</p>}
              {estudiantesEncontrados.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>Seleccione un estudiante:</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {estudiantesEncontrados.map(est => (
                      <li key={est.id} style={{ padding: '6px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                        onClick={() => seleccionarEstudiante(est)}
                        onMouseEnter={e => e.target.style.background = 'var(--surface2)'}
                        onMouseLeave={e => e.target.style.background = 'transparent'}
                      >
                        {est.nombres} {est.apellidos} ({est.curso})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="form-group">
              <label>Curso (opcional)</label>
              <select value={cursoSeleccionado} onChange={e => setCursoSeleccionado(e.target.value)}>
                <option value="">Todos los cursos</option>
                {CURSOS.map(c => (
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
                <small style={{ fontSize: 11, color: 'var(--muted)' }}>
                  (Solo aplica al buscar por estudiante o curso)
                </small>
              </div>
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
                {resultado.vistaGeneral ? (
                  <>
                    <p style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-head)' }}>
                      Todos los incidentes
                    </p>
                    <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                      Mostrando todos los incidentes registrados
                    </p>
                  </>
                ) : modoBusqueda === 'id' ? (
                  <>
                    <p style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-head)' }}>
                      {resultado.estudiante?.nombres} {resultado.estudiante?.apellidos}
                    </p>
                    <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                      Curso: {resultado.estudiante?.curso} · ID: {resultado.estudiante?.id}
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

            {/* Alerta de reincidencia */}
            {modoBusqueda === 'id' && resultado.estudiante && (
              (() => {
                const reincidencia = calcularReincidencia(resultado.incidentes)
                if (reincidencia) {
                  return (
                    <div style={{
                      marginTop: 12,
                      padding: '12px 16px',
                      background: 'rgba(248,113,113,0.15)',
                      border: '1px solid var(--danger)',
                      borderRadius: 8,
                      color: 'var(--danger)',
                      fontSize: 14,
                    }}>
                      <strong>⚠️ Alerta de reincidencia:</strong> El estudiante ha sido registrado como <strong>responsable</strong> en {reincidencia.total} incidentes. Revise el historial para tomar acciones preventivas.
                    </div>
                  )
                }
                return null
              })()
            )}
          </div>

          {resultado.incidentes.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: 'var(--muted)' }}>No se encontraron incidentes con los filtros aplicados.</p>
            </div>
          ) : (
            resultado.incidentes.map((item, i) => (
              <div key={i} className="card">
                {editandoId === item.incidente.id ? (
                  // ─── MODO EDICIÓN ───────────────────────────────────────────
                  cargandoDetalle ? (
                    <p style={{ fontSize: 13, color: 'var(--muted)' }}>Cargando detalle...</p>
                  ) : (
                    <form onSubmit={handleGuardarEdicion} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Fecha *</label>
                          <input type="date" name="fecha" required value={formIncidente.fecha} onChange={handleFormIncidenteChange} />
                        </div>
                        <div className="form-group">
                          <label>Hora</label>
                          <input type="time" name="hora" value={formIncidente.hora} onChange={handleFormIncidenteChange} />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Tipo de incidente *</label>
                          <select name="tipo" required value={formIncidente.tipo} onChange={handleFormIncidenteChange}>
                            {TIPOS.map(t => <option key={t} value={t}>{labelTipo[t]}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Gravedad *</label>
                          <select name="gravedad" required value={formIncidente.gravedad} onChange={handleFormIncidenteChange}>
                            {GRAVEDADES.map(g => <option key={g} value={g}>{labelGravedad[g]}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Descripción *</label>
                        <textarea
                          name="descripcion" required rows={3} value={formIncidente.descripcion}
                          onChange={handleFormIncidenteChange} style={{ resize: 'vertical' }}
                        />
                      </div>

                      {/* Involucrados existentes */}
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Involucrados</p>
                        {involucradosEdit.length === 0 ? (
                          <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', marginBottom: 12 }}>
                            Sin involucrados.
                          </p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                            {involucradosEdit.map((inv, idx) => (
                              <div key={idx} style={{
                                display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8,
                                padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8,
                              }}>
                                <span style={{ fontSize: 13, flex: '1 1 160px' }}>
                                  {inv.estudiante?.nombres} {inv.estudiante?.apellidos}
                                  <span style={{ color: 'var(--muted)', marginLeft: 6, fontSize: 11 }}>
                                    {inv.estudiante?.curso}
                                  </span>
                                </span>
                                <select
                                  value={inv.rol}
                                  onChange={e => handleCambiarRolInvolucradoEdit(idx, e.target.value)}
                                  style={{ fontSize: 12, padding: '5px 8px', maxWidth: 140 }}
                                >
                                  {ROLES_INV.map(r => <option key={r} value={r}>{labelRol[r]}</option>)}
                                </select>
                                <input
                                  type="text"
                                  placeholder="Observación"
                                  value={inv.observacion}
                                  onChange={e => handleCambiarObservacionEdit(idx, e.target.value)}
                                  style={{ fontSize: 12, padding: '5px 8px', flex: '1 1 140px' }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQuitarInvolucradoEdit(idx)}
                                  style={{ background: 'transparent', color: 'var(--danger)', fontSize: 12, padding: '4px 8px' }}
                                >
                                  Quitar
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Agregar nuevo involucrado */}
                        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Agregar involucrado</p>
                        <div className="form-row" style={{ marginBottom: 8 }}>
                          <div className="form-group">
                            <input
                              type="text" placeholder="Buscar por nombre..."
                              value={busquedaNombreEdit}
                              onChange={e => { setBusquedaNombreEdit(e.target.value); buscarEstudiantesEdit(e.target.value, busquedaCursoEdit) }}
                            />
                          </div>
                          <div className="form-group">
                            <select
                              value={busquedaCursoEdit}
                              onChange={e => { setBusquedaCursoEdit(e.target.value); buscarEstudiantesEdit(busquedaNombreEdit, e.target.value) }}
                            >
                              <option value="">Todos los cursos</option>
                              {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 8, maxWidth: 200 }}>
                          <select value={rolNuevoInv} onChange={e => setRolNuevoInv(e.target.value)}>
                            <option value="">Rol a asignar...</option>
                            {ROLES_INV.map(r => <option key={r} value={r}>{labelRol[r]}</option>)}
                          </select>
                        </div>

                        {(busquedaNombreEdit || busquedaCursoEdit) && (
                          buscandoEdit ? (
                            <p style={{ fontSize: 12, color: 'var(--muted)' }}>Buscando...</p>
                          ) : resultadosBusquedaEdit.length === 0 ? (
                            <p style={{ fontSize: 12, color: 'var(--muted)' }}>Sin resultados.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto', marginBottom: 8 }}>
                              {resultadosBusquedaEdit
                                .filter(est => !involucradosEdit.some(inv => inv.estudianteId === est.id))
                                .map(est => (
                                  <div
                                    key={est.id}
                                    onClick={() => handleAgregarInvolucradoEdit(est)}
                                    style={{
                                      display: 'flex', justifyContent: 'space-between', cursor: 'pointer',
                                      padding: '8px 12px', background: 'var(--surface2)', borderRadius: 6, fontSize: 13,
                                      border: '1px solid var(--border)',
                                    }}
                                  >
                                    <span>{est.nombres} {est.apellidos}</span>
                                    <span style={{ color: 'var(--muted)' }}>{est.curso}</span>
                                  </div>
                                ))}
                            </div>
                          )
                        )}
                      </div>

                      {errorEdicion && <p className="error-msg">{errorEdicion}</p>}

                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-secondary" onClick={handleCancelarEdicion} style={{ padding: '9px 18px' }}>
                          Cancelar
                        </button>
                        <button className="btn-primary" type="submit" disabled={guardandoIncidente} style={{ padding: '9px 18px' }}>
                          {guardandoIncidente ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                      </div>
                    </form>
                  )
                ) : (
                  // ─── MODO LECTURA ───────────────────────────────────────────
                  <>
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
                        {item.rol && (
                          <span className={`badge badge-${item.rol.toLowerCase()}`}>
                            {labelRol[item.rol]}
                          </span>
                        )}
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

                    {(modoBusqueda === 'curso' || resultado.vistaGeneral) && item.estudiante && (
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

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                      {confirmandoEliminar === item.incidente.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, color: 'var(--danger)' }}>¿Eliminar permanentemente?</span>
                          <button
                            className="btn-danger"
                            onClick={() => handleEliminarIncidente(item.incidente.id)}
                            disabled={eliminando}
                            style={{ fontSize: 12, padding: '6px 12px' }}
                          >
                            {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={() => setConfirmandoEliminar(null)}
                            style={{ fontSize: 12, padding: '6px 12px' }}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleIniciarEdicion(item.incidente.id)}
                            style={{
                              background: 'transparent', color: 'var(--accent)',
                              border: '1px solid var(--accent)', borderRadius: 6,
                              fontSize: 12, padding: '5px 12px',
                            }}
                          >
                            ✎ Editar
                          </button>
                          <button
                            onClick={() => setConfirmandoEliminar(item.incidente.id)}
                            style={{
                              background: 'transparent', color: 'var(--danger)',
                              border: '1px solid var(--danger)', borderRadius: 6,
                              fontSize: 12, padding: '5px 12px',
                            }}
                          >
                            Eliminar incidente
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}