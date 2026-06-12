import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'

export default function Layout() {
  const { logout, usuario } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const esEncargado = usuario?.rol === 'ENCARGADO_CONVIVENCIA'

  const links = [
    // Solo encargado de convivencia
    ...(esEncargado ? [
      { to: '/incidentes/nuevo', label: 'Registrar Incidente', icon: '＋' },
      { to: '/casos/nuevo',      label: 'Registrar Caso',    icon: '＋' },
    ] : []),
    // Todos los roles
    { to: '/estudiantes/historial', label: 'Ver Incidentes', icon: '⌕' },
    { to: '/casos',                 label: 'Ver Casos',      icon: '⌕' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 230,
        background: 'var(--accent)',
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 0',
        flexShrink: 0,
        boxShadow: '2px 0 12px rgba(107,31,42,0.15)'
      }}>
        <div style={{ padding: '0 22px 28px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, color: '#fff', lineHeight: 1.2 }}>
            Convivencia
          </div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, color: 'rgba(255,255,255,0.7)', lineHeight: 1.2 }}>
            Escolar
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
            Sistema de Gestión
          </div>
        </div>

        <nav style={{ flex: 1, padding: '18px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {links.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8,
              textDecoration: 'none', fontSize: 14, fontWeight: 600,
              fontFamily: 'var(--font-body)',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
              background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              transition: 'all 0.15s'
            })}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '18px 22px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          {usuario && (
            <>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4, wordBreak: 'break-all', fontFamily: 'var(--font-body)' }}>
                {usuario.email}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {usuario.rol?.replace(/_/g, ' ')}
              </div>
            </>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: '100%', fontSize: 13, padding: '9px',
              background: 'rgba(255,255,255,0.12)',
              color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
              fontFamily: 'var(--font-body)', fontWeight: 600
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.12)'}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '36px 40px', overflowY: 'auto', background: 'var(--bg)' }}>
        <Outlet />
      </main>
    </div>
  )
}
