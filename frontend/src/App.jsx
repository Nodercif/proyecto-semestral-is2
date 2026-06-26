import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import Login from './pages/Login'
import Layout from './components/Layout'
import RegistrarIncidente from './pages/RegistrarIncidente'
import HistorialEstudiante from './pages/HistorialEstudiante'
import CrearCaso from './pages/CrearCaso'
import HistorialCasos from './pages/HistorialCasos'
import ListaEstudiantes from './pages/ListaEstudiantes'
import { getMe } from './services/api'

export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

function PrivateRoute({ children }) {
  const { token, cargandoUsuario } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (cargandoUsuario) return null // evita parpadeo/redirección incorrecta mientras se recupera el usuario
  return children
}

// Ruta exclusiva para ENCARGADO_CONVIVENCIA
function EncargadoRoute({ children }) {
  const { usuario } = useAuth()
  if (usuario?.rol === 'ENCARGADO_CONVIVENCIA') return children
  return <Navigate to="/estudiantes/historial" replace />
}

// Redirección inicial según rol
function RoleBasedRedirect() {
  const { usuario } = useAuth()
  if (usuario?.rol === 'ENCARGADO_CONVIVENCIA') {
    return <Navigate to="/incidentes/nuevo" replace />
  }
  return <Navigate to="/estudiantes/historial" replace />
}

export default function App() {
  const [token, setToken]               = useState(() => localStorage.getItem('token'))
  const [usuario, setUsuario]           = useState(null)
  const [cargandoUsuario, setCargando]  = useState(() => !!localStorage.getItem('token'))

  // Si ya existe un token guardado (recarga de página, nueva pestaña, etc.)
  // recuperamos el usuario asociado antes de dejar pasar a las rutas privadas.
  useEffect(() => {
    if (!token) {
      setCargando(false)
      return
    }
    let activo = true
    getMe()
      .then(res => { if (activo) setUsuario(res.data.usuario ?? res.data) })
      .catch(() => {
        if (activo) {
          localStorage.removeItem('token')
          setToken(null)
          setUsuario(null)
        }
      })
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [token])

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ token, setToken, usuario, setUsuario, cargandoUsuario, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<RoleBasedRedirect />} />

            {/* Solo ENCARGADO_CONVIVENCIA */}
            <Route
              path="incidentes/nuevo"
              element={<PrivateRoute><EncargadoRoute><RegistrarIncidente /></EncargadoRoute></PrivateRoute>}
            />
            <Route
              path="casos/nuevo"
              element={<PrivateRoute><EncargadoRoute><CrearCaso /></EncargadoRoute></PrivateRoute>}
            />

            {/* Todos los usuarios autenticados */}
            <Route
              path="estudiantes/historial"
              element={<PrivateRoute><HistorialEstudiante /></PrivateRoute>}
            />
            <Route
              path="estudiantes"
              element={<PrivateRoute><ListaEstudiantes /></PrivateRoute>}
            />
            <Route
              path="casos"
              element={<PrivateRoute><HistorialCasos /></PrivateRoute>}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
