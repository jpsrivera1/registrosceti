import { Link, useLocation } from 'react-router-dom'

function Navbar({ user, onLogout }) {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path
  }

  const menuItems = [
    { path: '/', icon: 'bi-house-door-fill', label: 'Inicio' },
    { path: '/registrar', icon: 'bi-person-plus-fill', label: 'Registrar Estudiante' },
    { path: '/estudiantes', icon: 'bi-people-fill', label: 'Ver Estudiantes' },
    { path: '/pagos', icon: 'bi-cash-stack', label: 'Pagos' },
    { path: '/pagos-cursos', icon: 'bi-book', label: 'Cursos Extra' },
    { path: '/uniformes', icon: 'bi-person-badge-fill', label: 'Uniformes' },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-blue-900 text-white shadow-2xl z-50 flex flex-col">
      {/* Header del Sidebar */}
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <i className="bi bi-mortarboard-fill text-4xl text-blue-300"></i>
          <div>
            <h1 className="text-xl font-bold">Sistema de Registro</h1>
            <p className="text-xs text-blue-300">Gestión de Estudiantes</p>
          </div>
        </div>
      </div>

      {/* Menú de Navegación */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-blue-700 text-white shadow-lg'
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <i className={`${item.icon} text-xl`}></i>
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Usuario y Logout en el footer */}
      <div className="border-t border-blue-800 p-4">
        <div className="flex items-center gap-3 mb-3 px-2">
          <i className="bi bi-person-circle text-2xl text-blue-300"></i>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.username}</p>
            <p className="text-xs text-blue-400">Administrador</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <i className="bi bi-box-arrow-right"></i>
          <span>Salir</span>
        </button>
      </div>
    </aside>
  )
}

export default Navbar
