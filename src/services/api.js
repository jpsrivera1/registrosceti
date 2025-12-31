import axios from 'axios'

const API_URL = 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Autenticación
export const login = (data) => api.post('/auth/login', data)
export const verificarSesion = (userId) => api.post('/auth/verificar', { userId })

// Estudiantes
export const obtenerEstudiantes = () => api.get('/estudiantes')
export const obtenerEstudiante = (id) => api.get(`/estudiantes/${id}`)
export const crearEstudiante = (data) => api.post('/estudiantes', data)
export const actualizarEstudiante = (id, data) => api.put(`/estudiantes/${id}`, data)
export const eliminarEstudiante = (id) => api.delete(`/estudiantes/${id}`)

// Pagos
export const buscarEstudiantesPago = (nombre) => api.get(`/pagos/buscar?nombre=${nombre}`)
export const obtenerPagosEstudiante = (studentId) => api.get(`/pagos/estudiante/${studentId}`)
export const obtenerPago = (studentId, tipoPago) => api.get(`/pagos/estudiante/${studentId}/${tipoPago}`)
export const guardarPago = (studentId, tipoPago, data) => api.post(`/pagos/estudiante/${studentId}/${tipoPago}`, data)
export const obtenerResumenPagos = () => api.get('/pagos/resumen')
export const obtenerMetodosPago = () => api.get('/pagos/metodos-pago')

// Graduación
export const obtenerPagoGraduacion = (studentId) => api.get(`/pagos/graduacion/${studentId}`)
export const guardarPagoGraduacion = (studentId, data) => api.post(`/pagos/graduacion/${studentId}`, data)

// Colegiaturas
export const obtenerColegiaturas = (studentId) => api.get(`/pagos/colegiaturas/${studentId}`)
export const verificarMesPagado = (studentId, mes) => api.get(`/pagos/colegiaturas/${studentId}/mes/${mes}`)
export const registrarColegiatura = (studentId, data) => api.post(`/pagos/colegiaturas/${studentId}`, data)
export const obtenerInfoRecibo = (pagoId) => api.get(`/pagos/colegiaturas/recibo/${pagoId}`)

// Uniformes - Tallas
export const buscarEstudiantesUniforme = (nombre) => api.get(`/uniformes/buscar?nombre=${nombre}`)
export const obtenerCategorias = () => api.get('/uniformes/categorias')
export const obtenerCategoriaEstudiante = (studentId) => api.get(`/uniformes/categorias/estudiante/${studentId}`)
export const obtenerTallasEstudiante = (studentId) => api.get(`/uniformes/tallas/${studentId}`)
export const guardarTallas = (studentId, tallas) => api.post(`/uniformes/tallas/${studentId}`, { tallas })
export const eliminarTalla = (id) => api.delete(`/uniformes/tallas/${id}`)

// Cursos Extra
export const obtenerCursosExtra = () => api.get('/cursos/cursos-extra')
export const obtenerEstudiantesCursos = () => api.get('/cursos/estudiantes-cursos')
export const buscarEstudiantesCursos = (nombre) => api.get(`/cursos/estudiantes-cursos/buscar?nombre=${nombre}`)
export const obtenerMeses = () => api.get('/cursos/meses')
export const obtenerPagosCurso = (estudianteId) => api.get(`/cursos/pagos-curso/${estudianteId}`)
export const verificarMesPagadoCurso = (estudianteId, mesId) => api.get(`/cursos/pagos-curso/verificar/${estudianteId}/${mesId}`)
export const registrarPagoCurso = (data) => api.post('/cursos/pagos-curso', data)
export const obtenerResumenPagosCursos = (estudianteId) => api.get(`/cursos/pagos-curso/resumen/${estudianteId}`)

export default api
