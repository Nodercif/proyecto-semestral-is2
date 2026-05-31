import { useState } from 'react'
import { crearIncidente, agregarInvolucrado } from '../services/api'

const TIPOS = ['CONFLICTO', 'AGRESION_FISICA', 'AGRESION_VERBAL', 'ACOSO', 'DANO_MATERIAL']
const GRAVEDADES = ['LEVE', 'MODERADO', 'GRAVE', 'MUY_GRAVE']
const ROLES_INV = ['AFECTADO', 'RESPONSABLE', 'TESTIGO', 'INTERVINIENTE']

const labelTipo = { CONFLICTO: 'Conflicto', AGRESION_FISICA: 'Agresión Física', AGRESION_VERBAL: 'Agresión Verbal', ACOSO: 'Acoso', DANO_MATERIAL: 'Daño Material' }
const labelGravedad = { LEVE: 'Leve', MODERADO: 'Moderado', GRAVE: 'Grave', MUY_GRAVE: 'Muy Grave' }

export default function RegistrarIncidente() {
  // HU1 — datos del incidente
  const [form, setForm] = useState({
    fecha: '', hora: '', descripcion: '', tipo: '', gravedad: ''
  })
  // HU2 — involucrados
  const [involucrado, setInvolucrado] = useState({ estudianteId: '', rol: '', observacion: '' })
  const [involucrados, setInvolucrados] = useState([])

  const [incidenteCreado, setIncidenteCreado] = useState(null)
  const [paso, setPaso] = useState(1) // 1: datos incidente, 2: involucrados
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState('')

  const handleFormChange = e => setForm({ ...form, [e.target.name]: e.target.value })
  const handleInvChange  = e => setInvolucrado({ ...involucrado, [e.target.name]: e.target.value })

  // Paso 1: crear incidente
  const handleCrearIncidente = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fechaHora = new Date(`${form.fecha}T${form.hora || '00:00'}`)
      const res = await crearIncidente({
        fecha: fechaHora.toISOString(),
        descripcion: form.descripcion,
        tipo: form.tipo,
        gravedad: form.gravedad
      })
      setIncidenteCreado(res.data)
      setPaso(2)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el incidente')
    } finally {
      setLoading(false)
    }
  }

  // Paso 2: agregar involucrado
  const handleAgregarInvolucrado = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await agregarInvolucrado(incidenteCreado.id, {
        estudianteId: parseInt(involucrado.estudianteId),
        rol: involucrado.rol,
        observacion: involucrado.observacion || undefined
      })
      setInvolucrados([...involucrados, res.data])
      setInvolucrado({ estudianteId: '', rol: '', observacion: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'Error al agregar involucrado')
    } finally {
      setLoading(false)
    }
  }

  const handleFinalizar = () => {
    setExito(`Incidente #${incidenteCreado.id} registrado con ${involucrados.length} involucrado(s).`)
    setForm({ fecha: '', hora: '', descripcion: '', tipo: '', gravedad: '' })
    setInvolucrados([])
    setIncidenteCreado(null)
    setPaso(1)
    setTimeout(() => setExito(''), 5000)
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 26, marginBottom: 6 }}>
        Registrar Incidente
      </h2>
      <p style={{ color: 'var(--muted)', marginBottom: 28, fontSize: 14 }}>
        Complete los datos del incidente y luego agregue los estudiantes involucrados.
      </p>

      {exito && <div className="card" style={{ borderColor: 'var(--success)', marginBottom: 20 }}>
        <p className="success-msg" style={{ fontSize: 14 }}>✓ {exito}</p>
      </div>}

      {/* Indicador de pasos */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['Datos del incidente', 'Involucrados'].map((label, i) => (
          <div key={i} style={{
            flex: 1, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, textAlign: 'center',
            background: paso === i + 1 ? 'rgba(79,142,247,0.15)' : 'var(--surface)',
            color: paso === i + 1 ? 'var(--accent)' : 'var(--muted)',
            border: `1.5px solid ${paso === i + 1 ? 'var(--accent)' : 'var(--border)'}`,
          }}>
            {i + 1}. {label}
            {paso > i + 1 && ' ✓'}
          </div>
        ))}
      </div>

      {/* Paso 1: datos del incidente */}
      {paso === 1 && (
        <div className="card">
          <form onSubmit={handleCrearIncidente} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-row">
              <div className="form-group">
                <label>Fecha *</label>
                <input type="date" name="fecha" required value={form.fecha} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label>Hora</label>
                <input type="time" name="hora" value={form.hora} onChange={handleFormChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tipo de incidente *</label>
                <select name="tipo" required value={form.tipo} onChange={handleFormChange}>
                  <option value="">Seleccionar...</option>
                  {TIPOS.map(t => <option key={t} value={t}>{labelTipo[t]}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Nivel de gravedad *</label>
                <select name="gravedad" required value={form.gravedad} onChange={handleFormChange}>
                  <option value="">Seleccionar...</option>
                  {GRAVEDADES.map(g => <option key={g} value={g}>{labelGravedad[g]}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Descripción *</label>
              <textarea
                name="descripcion" required rows={4} value={form.descripcion}
                placeholder="Describa detalladamente el incidente ocurrido..."
                onChange={handleFormChange}
                style={{ resize: 'vertical' }}
              />
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Continuar → Agregar involucrados'}
            </button>
          </form>
        </div>
      )}

      {/* Paso 2: involucrados */}
      {paso === 2 && incidenteCreado && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ borderColor: 'rgba(79,142,247,0.3)' }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Incidente creado</p>
            <p style={{ fontSize: 15, fontWeight: 500 }}>
              #{incidenteCreado.id} — {labelTipo[incidenteCreado.tipo]} · {labelGravedad[incidenteCreado.gravedad]}
            </p>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Agregar involucrado</h3>
            <form onSubmit={handleAgregarInvolucrado} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-row">
                <div className="form-group">
                  <label>ID del estudiante *</label>
                  <input
                    type="number" name="estudianteId" required min={1}
                    placeholder="Ej: 1"
                    value={involucrado.estudianteId} onChange={handleInvChange}
                  />
                </div>
                <div className="form-group">
                  <label>Rol *</label>
                  <select name="rol" required value={involucrado.rol} onChange={handleInvChange}>
                    <option value="">Seleccionar...</option>
                    {ROLES_INV.map(r => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Observación (opcional)</label>
                <input type="text" name="observacion" placeholder="Ej: Inició la agresión"
                  value={involucrado.observacion} onChange={handleInvChange} />
              </div>
              {error && <p className="error-msg">{error}</p>}
              <button className="btn-secondary" type="submit" disabled={loading}>
                {loading ? 'Agregando...' : '+ Agregar involucrado'}
              </button>
            </form>
          </div>

          {/* Lista de involucrados agregados */}
          {involucrados.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 12 }}>
                Involucrados agregados ({involucrados.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {involucrados.map((inv, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8
                  }}>
                    <span style={{ fontSize: 14 }}>
                      {inv.estudiante?.nombres} {inv.estudiante?.apellidos}
                      <span style={{ color: 'var(--muted)', marginLeft: 8, fontSize: 12 }}>
                        ID {inv.estudianteId}
                      </span>
                    </span>
                    <span className={`badge badge-${inv.rol.toLowerCase()}`}>{inv.rol}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="btn-primary" onClick={handleFinalizar} style={{ alignSelf: 'flex-end', padding: '11px 28px' }}>
            Finalizar registro
          </button>
        </div>
      )}
    </div>
  )
}
