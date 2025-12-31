import { Link, useLocation } from 'react-router-dom'

function Navbar({ user, onLogout }) {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path
      ? 'bg-blue-700 text-white'
      : 'text-blue-100 hover:bg-blue-600'
  }

  return (
    <nav className="bg-blue-800 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <i className="bi bi-mortarboard-fill text-2xl text-white"></i>
            <span className="text-white font-bold text-xl">Sistema de Registro</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isActive('/')}`}
              >
                <i className="bi bi-house-door"></i>
                Inicio
              </Link>
              <Link
                to="/registrar"
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isActive('/registrar')}`}
              >
                <i className="bi bi-person-plus"></i>
                Registrar
              </Link>
              <Link
                to="/estudiantes"
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isActive('/estudiantes')}`}
              >
                <i className="bi bi-people"></i>
                Estudiantes
              </Link>
              <Link
                to="/pagos"
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isActive('/pagos')}`}
              >
                <i className="bi bi-cash-stack"></i>
                Pagos
              </Link>
              <Link
                to="/uniformes"
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isActive('/uniformes')}`}
              >
                <i className="bi bi-person-badge"></i>
                Uniformes
              </Link>
            </div>

            {/* Usuario y Logout */}
            <div className="flex items-center space-x-3 border-l border-blue-600 pl-4">
              <div className="flex items-center gap-2 text-blue-100">
                <i className="bi bi-person-circle text-xl"></i>
                <span className="font-medium">{user?.username}</span>
              </div>
              <button
                onClick={onLogout}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <i className="bi bi-box-arrow-right"></i>
                Salir
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
