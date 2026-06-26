import { useState, useEffect } from 'react'
import { getEstudiantes, crearEstudiante, editarEstudiante, eliminarEstudiante } from '../services/api'
import { CURSOS } from '../constants/cursos'

export default function ListaEstudiantes() {
  const [estudiantes, setEstudiantes] = useState([])
  const [filtroCurso, setFiltroCurso] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  // Estado para el formulario (crear/editar)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [formData, setFormData] = useState({ rut: '', nombres: '', apellidos: '', curso: '' })
  const [enviando, setEnviando] = useState(false)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null)

  const cargarEstudiantes = async () => {
    setLoading(true)
    setError('')
    try {
      const params = filtroCurso ? { curso: filtroCurso } : {}
      const res = await getEstudiantes(params)
      setEstudiantes(res.data.data || [])
    } catch (err) {
      setError('Error al cargar los estudiantes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarEstudiantes()
  }, [filtroCurso])

  const handleFiltroChange = (e) => {
    setFiltroCurso(e.target.value)
  }

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const resetForm = () => {
    setFormData({ rut: '', nombres: '', apellidos: '', curso: '' })
    setEditandoId(null)
    setMostrarForm(false)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      if (editandoId) {
        await editarEstudiante(editandoId, formData)
        setExito('Estudiante actualizado correctamente.')
      } else {
        await crearEstudiante(formData)
        setExito('Estudiante creado correctamente.')
      }
      resetForm()
      cargarEstudiantes()
      setTimeout(() => setExito(''), 4000)
    } catch (err) {
      const msg = err.response?.data?.errores?.join(' ') || err.response?.data?.error || 'Error al guardar.'
      setError(msg)
    } finally {
      setEnviando(false)
    }
  }

  const handleEditar = (est) => {
    setFormData({
      rut: est.rut,
      nombres: est.nombres,
      apellidos: est.apellidos,
      curso: est.curso,
    })
    setEditandoId(est.id)
    setMostrarForm(true)
    setError('')
  }

  const handleEliminar = async (id) => {
    setEnviando(true)
    setError('')
    try {
      await eliminarEstudiante(id)
      setExito('Estudiante eliminado correctamente.')
      setConfirmandoEliminar(null)
      cargarEstudiantes()
      setTimeout(() => setExito(''), 4000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar.')
    } finally {
      setEnviando(false)
    }
  }

  // Agrupar estudiantes por curso
  const grupos = {}
  estudiantes.forEach(est => {
    if (!grupos[est.curso]) grupos[est.curso] = []
    grupos[est.curso].push(est)
  })
  const cursosOrdenados = Object.keys(grupos).sort()

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 26, marginBottom: 6 }}>
        Gestión de Estudiantes
      </h2>
      <p style={{ color: 'var(--muted)', marginBottom: 28, fontSize: 14 }}>
        Administre los estudiantes del establecimiento. Puede agregar, editar o eliminar.
      </p>

      {exito && (
        <div className="card" style={{ borderColor: 'var(--success)', marginBottom: 20 }}>
          <p className="success-msg">✓ {exito}</p>
        </div>
      )}
      {error && (
        <div className="card" style={{ borderColor: 'var(--danger)', marginBottom: 20 }}>
          <p className="error-msg">{error}</p>
        </div>
      )}

      {/* Barra de filtro y botón agregar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>Filtrar por curso:</label>
            <select value={filtroCurso} onChange={handleFiltroChange} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', flex: 1, minWidth: 150 }}>
                <option value="">Todos los cursos</option>
                {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>
        <button
            className="btn-primary"
            onClick={() => { setMostrarForm(true); setEditandoId(null); setFormData({ rut: '', nombres: '', apellidos: '', curso: '' }); setError('') }}
            style={{ whiteSpace: 'nowrap' }}
        >
            + Agregar estudiante
         </button>
        </div>

      {/* Formulario (crear/editar) - se muestra inline cuando se activa */}
      {mostrarForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>
            {editandoId ? 'Editar estudiante' : 'Agregar nuevo estudiante'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-row">
              <div className="form-group">
                <label>RUT *</label>
                <input
                  type="text" name="rut" required
                  placeholder="Ej: 12345678-9"
                  value={formData.rut} onChange={handleFormChange}
                />
              </div>
              <div className="form-group">
                <label>Nombres *</label>
                <input
                  type="text" name="nombres" required
                  placeholder="Nombres"
                  value={formData.nombres} onChange={handleFormChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Apellidos *</label>
                <input
                  type="text" name="apellidos" required
                  placeholder="Apellidos"
                  value={formData.apellidos} onChange={handleFormChange}
                />
              </div>
              <div className="form-group">
                <label>Curso *</label>
                <select name="curso" required value={formData.curso} onChange={handleFormChange}>
                  <option value="">Seleccionar curso</option>
                  {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancelar
              </button>
              <button className="btn-primary" type="submit" disabled={enviando}>
                {enviando ? 'Guardando...' : editandoId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Listado agrupado por curso */}
      {loading ? (
        <p>Cargando...</p>
      ) : estudiantes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--muted)' }}>No hay estudiantes registrados.</p>
        </div>
      ) : (
        cursosOrdenados.map(curso => (
          <div key={curso} style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--accent)' }}>
              {curso} ({grupos[curso].length})
            </h3>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--surface2)', borderBottom: '2px solid var(--border)' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>RUT</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>Nombres</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>Apellidos</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {grupos[curso].map(est => (
                    <tr key={est.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 16px', fontSize: 14 }}>{est.rut}</td>
                      <td style={{ padding: '10px 16px', fontSize: 14 }}>{est.nombres}</td>
                      <td style={{ padding: '10px 16px', fontSize: 14 }}>{est.apellidos}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                          <button
                            onClick={() => handleEditar(est)}
                            style={{
                              background: 'transparent', color: 'var(--accent)',
                              border: '1px solid var(--accent)', borderRadius: 4,
                              padding: '4px 12px', fontSize: 12, cursor: 'pointer'
                            }}
                          >
                            Editar
                          </button>
                          {confirmandoEliminar === est.id ? (
                            <>
                              <span style={{ fontSize: 12, color: 'var(--danger)' }}>¿Seguro?</span>
                              <button
                                onClick={() => handleEliminar(est.id)}
                                style={{
                                  background: 'var(--danger)', color: '#fff',
                                  border: 'none', borderRadius: 4,
                                  padding: '4px 12px', fontSize: 12, cursor: 'pointer'
                                }}
                              >
                                Sí
                              </button>
                              <button
                                onClick={() => setConfirmandoEliminar(null)}
                                style={{
                                  background: 'transparent', color: 'var(--muted)',
                                  border: '1px solid var(--border)', borderRadius: 4,
                                  padding: '4px 12px', fontSize: 12, cursor: 'pointer'
                                }}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmandoEliminar(est.id)}
                              style={{
                                background: 'transparent', color: 'var(--danger)',
                                border: '1px solid var(--danger)', borderRadius: 4,
                                padding: '4px 12px', fontSize: 12, cursor: 'pointer'
                              }}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  )
}