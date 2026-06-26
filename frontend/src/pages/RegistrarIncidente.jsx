import { useState, useEffect, useRef } from 'react';
import { crearIncidenteCompleto, getEstudiantes } from '../services/api';
import { CURSOS } from '../constants/cursos';

const TIPOS = ['CONFLICTO', 'AGRESION_FISICA', 'AGRESION_VERBAL', 'ACOSO', 'DANO_MATERIAL'];
const GRAVEDADES = ['LEVE', 'MODERADO', 'GRAVE', 'MUY_GRAVE'];
const ROLES_INV = ['AFECTADO', 'RESPONSABLE', 'TESTIGO', 'INTERVINIENTE'];

const labelTipo = { CONFLICTO: 'Conflicto', AGRESION_FISICA: 'Agresión Física', AGRESION_VERBAL: 'Agresión Verbal', ACOSO: 'Acoso', DANO_MATERIAL: 'Daño Material' };
const labelGravedad = { LEVE: 'Leve', MODERADO: 'Moderado', GRAVE: 'Grave', MUY_GRAVE: 'Muy Grave' };

export default function RegistrarIncidente() {
  // Paso 1: datos del incidente (sin guardar)
  const [form, setForm] = useState({
    fecha: '',
    hora: '',
    descripcion: '',
    tipo: '',
    gravedad: ''
  });

  // Paso 2: involucrados (locales)
  const [involucrados, setInvolucrados] = useState([]);
  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [busquedaCurso, setBusquedaCurso] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscandoEstudiantes, setBuscandoEstudiantes] = useState(false);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [rolInv, setRolInv] = useState('');
  const [observacionInv, setObservacionInv] = useState('');
  const debounceRef = useRef(null);

  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const handleFormChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  // Buscar estudiantes con debounce
  useEffect(() => {
    if (paso !== 2) return;
    if (!busquedaNombre && !busquedaCurso) {
      setResultadosBusqueda([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setBuscandoEstudiantes(true);
      try {
        const params = {};
        if (busquedaNombre) params.nombre = busquedaNombre;
        if (busquedaCurso) params.curso = busquedaCurso;
        const res = await getEstudiantes(params);
        setResultadosBusqueda(res.data.data || []);
      } catch {
        setResultadosBusqueda([]);
      } finally {
        setBuscandoEstudiantes(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [busquedaNombre, busquedaCurso, paso]);

  // Pasar al paso 2 sin guardar
  const handleContinuar = (e) => {
    e.preventDefault();
    if (!form.fecha || !form.descripcion || !form.tipo || !form.gravedad) {
      setError('Complete todos los campos obligatorios.');
      return;
    }
    setError('');
    setPaso(2);
  };

  // Volver al paso 1 (retroceder)
  const handleVolver = () => {
    setPaso(1);
    setError('');
  };

  // Agregar involucrado localmente (sin persistir)
  const handleAgregarInvolucrado = (e) => {
    e.preventDefault();
    if (!estudianteSeleccionado || !rolInv) {
      setError('Seleccione un estudiante y un rol.');
      return;
    }
    const yaExiste = involucrados.some(inv => inv.estudianteId === estudianteSeleccionado.id && inv.rol === rolInv);
    if (yaExiste) {
      setError('Este estudiante ya tiene ese rol.');
      return;
    }
    setInvolucrados([
      ...involucrados,
      {
        estudianteId: estudianteSeleccionado.id,
        rol: rolInv,
        observacion: observacionInv || undefined,
        _estudiante: estudianteSeleccionado, // para mostrar
      }
    ]);
    // Resetear búsqueda
    setEstudianteSeleccionado(null);
    setBusquedaNombre('');
    setBusquedaCurso('');
    setResultadosBusqueda([]);
    setRolInv('');
    setObservacionInv('');
    setError('');
  };

  const handleQuitarInvolucrado = (idx) => {
    setInvolucrados(involucrados.filter((_, i) => i !== idx));
  };

  // Guardar todo al final
  const handleFinalizar = async () => {
    if (involucrados.length === 0) {
      setError('Debe agregar al menos un involucrado.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fechaHora = new Date(`${form.fecha}T${form.hora || '00:00'}`);
      const payload = {
        fecha: fechaHora.toISOString(),
        descripcion: form.descripcion,
        tipo: form.tipo,
        gravedad: form.gravedad,
        involucrados: involucrados.map(inv => ({
          estudianteId: inv.estudianteId,
          rol: inv.rol,
          observacion: inv.observacion,
        })),
      };
      const res = await crearIncidenteCompleto(payload);
      setExito(`Incidente #${res.data.data.id} registrado con ${involucrados.length} involucrado(s).`);
      // Reiniciar
      setForm({ fecha: '', hora: '', descripcion: '', tipo: '', gravedad: '' });
      setInvolucrados([]);
      setPaso(1);
      setTimeout(() => setExito(''), 5000);
    } catch (err) {
      const msg = err.response?.data?.errores?.join(' ') || err.response?.data?.error || 'Error al registrar.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resultadosFiltrados = resultadosBusqueda.filter(
    est => !involucrados.some(inv => inv.estudianteId === est.id)
  );

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 26, marginBottom: 6 }}>
        Registrar Incidente
      </h2>
      <p style={{ color: 'var(--muted)', marginBottom: 28, fontSize: 14 }}>
        Complete los datos del incidente y luego agregue los estudiantes involucrados.
      </p>

      {exito && <div className="card" style={{ borderColor: 'var(--success)', marginBottom: 20 }}>
        <p className="success-msg">✓ {exito}</p>
      </div>}

      {/* Pasos */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['Datos del incidente', 'Involucrados'].map((label, i) => (
          <div key={i} style={{
            flex: 1, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, textAlign: 'center',
            background: paso === i + 1 ? 'rgba(79,142,247,0.15)' : 'var(--surface)',
            color: paso === i + 1 ? 'var(--accent)' : 'var(--muted)',
            border: `1.5px solid ${paso === i + 1 ? 'var(--accent)' : 'var(--border)'}`,
          }}>
            {i + 1}. {label}
          </div>
        ))}
      </div>

      {/* Paso 1 */}
      {paso === 1 && (
        <div className="card">
          <form onSubmit={handleContinuar} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
                <label>Tipo *</label>
                <select name="tipo" required value={form.tipo} onChange={handleFormChange}>
                  <option value="">Seleccionar...</option>
                  {TIPOS.map(t => <option key={t} value={t}>{labelTipo[t]}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Gravedad *</label>
                <select name="gravedad" required value={form.gravedad} onChange={handleFormChange}>
                  <option value="">Seleccionar...</option>
                  {GRAVEDADES.map(g => <option key={g} value={g}>{labelGravedad[g]}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Descripción *</label>
              <textarea name="descripcion" required rows={4} value={form.descripcion} onChange={handleFormChange} />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button className="btn-primary" type="submit">
              Continuar → Agregar involucrados
            </button>
          </form>
        </div>
      )}

      {/* Paso 2 */}
      {paso === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ borderColor: 'rgba(79,142,247,0.3)' }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Incidente a registrar</p>
            <p style={{ fontSize: 15, fontWeight: 500 }}>
              {labelTipo[form.tipo]} · {labelGravedad[form.gravedad]} · {new Date(form.fecha).toLocaleDateString('es-CL')}
            </p>
            <button className="btn-secondary" onClick={handleVolver} style={{ fontSize: 13, padding: '6px 14px' }}>
              ← Volver
            </button>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Agregar involucrado</h3>
            <div className="form-row" style={{ marginBottom: 14 }}>
              <div className="form-group">
                <label>Buscar por nombre</label>
                <input type="text" placeholder="Ej: Sofía Becerra" value={busquedaNombre}
                  onChange={e => { setBusquedaNombre(e.target.value); setEstudianteSeleccionado(null); }} />
              </div>
              <div className="form-group">
                <label>Curso</label>
                <select value={busquedaCurso} onChange={e => { setBusquedaCurso(e.target.value); setEstudianteSeleccionado(null); }}>
                  <option value="">Todos</option>
                  {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {(busquedaNombre || busquedaCurso) && !estudianteSeleccionado && (
              <div style={{ marginBottom: 16 }}>
                {buscandoEstudiantes ? <p>Buscando...</p> :
                  resultadosFiltrados.length === 0 ? <p>No se encontraron estudiantes.</p> :
                  <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {resultadosFiltrados.map(est => (
                      <div key={est.id} onClick={() => setEstudianteSeleccionado(est)}
                        style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px',
                          background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}>
                        <span>{est.nombres} {est.apellidos}</span>
                        <span style={{ color: 'var(--muted)' }}>{est.curso}</span>
                      </div>
                    ))}
                  </div>
                }
              </div>
            )}

            {estudianteSeleccionado && (
              <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(45,122,79,0.06)', borderRadius: 8 }}>
                ✓ {estudianteSeleccionado.nombres} {estudianteSeleccionado.apellidos} ({estudianteSeleccionado.curso})
                <button onClick={() => { setEstudianteSeleccionado(null); setBusquedaNombre(''); setBusquedaCurso(''); }}
                  style={{ marginLeft: 12, background: 'transparent', color: 'var(--muted)' }}>
                  Cambiar
                </button>
              </div>
            )}

            <form onSubmit={handleAgregarInvolucrado} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Rol *</label>
                <select required value={rolInv} onChange={e => setRolInv(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {ROLES_INV.map(r => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Observación (opcional)</label>
                <input type="text" placeholder="Ej: Inició la agresión" value={observacionInv}
                  onChange={e => setObservacionInv(e.target.value)} />
              </div>
              {error && <p className="error-msg">{error}</p>}
              <button className="btn-secondary" type="submit" disabled={!estudianteSeleccionado}>
                + Agregar involucrado
              </button>
            </form>
          </div>

          {involucrados.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 12 }}>
                Involucrados ({involucrados.length})
              </h3>
              {involucrados.map((inv, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px',
                  background: 'var(--surface2)', borderRadius: 8, marginBottom: 6 }}>
                  <span>
                    {inv._estudiante.nombres} {inv._estudiante.apellidos} ({inv._estudiante.curso})
                    <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--muted)' }}>{inv.rol}</span>
                    {inv.observacion && <span style={{ marginLeft: 8, fontStyle: 'italic' }}>— {inv.observacion}</span>}
                  </span>
                  <button onClick={() => handleQuitarInvolucrado(idx)}
                    style={{ background: 'transparent', color: 'var(--danger)', border: 'none', cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button className="btn-secondary" onClick={handleVolver}>← Volver</button>
            <button className="btn-primary" onClick={handleFinalizar} disabled={loading || involucrados.length === 0}>
              {loading ? 'Guardando...' : 'Finalizar registro'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}