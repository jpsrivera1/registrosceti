import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import RegistrarEstudiante from './pages/RegistrarEstudiante'
import ListaEstudiantes from './pages/ListaEstudiantes'
import EditarEstudiante from './pages/EditarEstudiante'
import Pagos from './pages/Pagos'
import Uniformes from './pages/Uniformes'
import PagosCursos from './pages/PagosCursos'

// Componente para proteger rutas
function ProtectedRoute({ children, user }) {
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay usuario guardado en localStorage
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600 flex items-center gap-2">
          <i className="bi bi-arrow-repeat animate-spin"></i>
          Cargando...
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        <main className={user ? "container mx-auto px-4 py-8" : ""}>
          <Routes>
            <Route 
              path="/login" 
              element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} 
            />
            <Route 
              path="/" 
              element={
                <ProtectedRoute user={user}>
                  <Home />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/registrar" 
              element={
                <ProtectedRoute user={user}>
                  <RegistrarEstudiante />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/estudiantes" 
              element={
                <ProtectedRoute user={user}>
                  <ListaEstudiantes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/editar/:id" 
              element={
                <ProtectedRoute user={user}>
                  <EditarEstudiante />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pagos" 
              element={
                <ProtectedRoute user={user}>
                  <Pagos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/uniformes" 
              element={
                <ProtectedRoute user={user}>
                  <Uniformes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pagos-cursos" 
              element={
                <ProtectedRoute user={user}>
                  <PagosCursos />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

export default App
