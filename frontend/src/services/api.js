import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const getMe = () =>
  api.get('/auth/me')

export const crearIncidente = (data) =>
  api.post('/incidentes', data)

export const crearIncidenteCompleto = (data) =>
  api.post('/incidentes', data)

export const agregarInvolucrado = (incidenteId, data) =>
  api.post(`/incidentes/${incidenteId}/involucrados`, data)

export const getHistorialEstudiante = (estudianteId, params = {}) =>
  api.get(`/estudiantes/${estudianteId}/incidentes`, { params })

export const getHistorialCurso = (curso, params = {}) =>
  api.get(`/estudiantes/curso/${encodeURIComponent(curso)}/incidentes`, { params })

// ── Búsqueda de estudiantes (selector de involucrados) ──────────────────────
export const getEstudiantes = (params = {}) =>
  api.get('/estudiantes', { params })

// ── Incidentes (buscador genérico, usado en Crear Caso) ─────────────────────
export const getIncidentes = (params = {}) =>
  api.get('/incidentes', { params })

// ── Casos ─────────────────────────────────────────────────────────────────────
export const crearCaso = (data) =>
  api.post('/casos', data)

export const asociarIncidenteACaso = (casoId, incidenteId) =>
  api.post(`/casos/${casoId}/incidentes`, { incidenteId })

export const getCaso = (casoId) =>
  api.get(`/casos/${casoId}`)

export const getCasos = (params = {}) =>
  api.get('/casos', { params })

export const registrarAccion = (casoId, data) =>
  api.post(`/casos/${casoId}/acciones`, data)

export const actualizarEstadoCaso = (casoId, estado) =>
  api.patch(`/casos/${casoId}/estado`, { estado })

export const eliminarCaso = (casoId) =>
  api.delete(`/casos/${casoId}`)

export const editarCaso = (casoId, data) =>
  api.put(`/casos/${casoId}`, data)

export const desasociarIncidenteDeCaso = (casoId, incidenteId) =>
  api.delete(`/casos/${casoId}/incidentes/${incidenteId}`)

export const editarAccion = (casoId, accionId, data) =>
  api.put(`/casos/${casoId}/acciones/${accionId}`, data)

export const eliminarAccion = (casoId, accionId) =>
  api.delete(`/casos/${casoId}/acciones/${accionId}`)

export const eliminarIncidente = (incidenteId) =>
  api.delete(`/incidentes/${incidenteId}`)

// ── Edición de incidentes ─────────────────────────────────────────────────────
export const getIncidente = (incidenteId) =>
  api.get(`/incidentes/${incidenteId}`)

export const editarIncidente = (incidenteId, data) =>
  api.put(`/incidentes/${incidenteId}`, data)

// ── Gestión de estudiantes (CRUD) ──────────────────────────────────────────
export const crearEstudiante = (data) =>
  api.post('/estudiantes', data)

export const editarEstudiante = (id, data) =>
  api.put(`/estudiantes/${id}`, data)

export const eliminarEstudiante = (id) =>
  api.delete(`/estudiantes/${id}`)

export default api