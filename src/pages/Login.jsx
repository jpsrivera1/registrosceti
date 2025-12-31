import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { login } from '../services/api'

function Login({ onLogin }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.username || !formData.password) {
      toast.error('Por favor ingresa usuario y contraseña')
      return
    }

    setLoading(true)
    try {
      const response = await login(formData)
      
      // Guardar usuario en localStorage
      localStorage.setItem('user', JSON.stringify(response.data.user))
      
      toast.success(`¡Bienvenido ${response.data.user.username}!`)
      onLogin(response.data.user)
      navigate('/')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <i className="bi bi-mortarboard-fill text-4xl text-blue-600"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Sistema de Registro</h1>
          <p className="text-gray-500 mt-2">Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="bi bi-person me-2"></i>
              Usuario
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Ingresa tu usuario"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="bi bi-lock me-2"></i>
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <i className="bi bi-arrow-repeat animate-spin"></i>
                Ingresando...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right"></i>
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <i className="bi bi-shield-lock me-1"></i>
          Acceso solo para usuarios autorizados
        </div>
      </div>
    </div>
  )
}

export default Login
