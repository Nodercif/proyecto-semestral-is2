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

export const getHistorialCurso = (curso, params = {}) =>
  api.get(`/estudiantes/curso/${encodeURIComponent(curso)}/incidentes`, { params })

export default api
