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

export const agregarInvolucrado = (incidenteId, data) =>
  api.post(`/incidentes/${incidenteId}/involucrados`, data)

export const getHistorialEstudiante = (estudianteId, params = {}) =>
  api.get(`/estudiantes/${estudianteId}/incidentes`, { params })

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

export default api
