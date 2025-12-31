import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { crearEstudiante, obtenerCursosExtra } from '../services/api'

// Opciones para los selectores
const GRADOS_MATUTINA = [
  'Kinder',
  'Prepa',
  '1ro Primaria',
  '2do Primaria',
  '3ro Primaria',
  '7mo',
  '8vo',
  '9no',
  '4to BACO',
  '5to BACO',
  '4to PCB',
  '5to PCB',
  '6to PCB'
]

const GRADOS_VESPERTINA = [
  '4to. BACH en Diseño',
  '4to. BACH en Mecánica',
  '4to. BACH en Electricidad',
  '4to. PCB',
  '4to Magisterio Infantil',
  '5to. BACH en Diseño',
  '5to. BACH en Mecánica',
  '5to. BACH en Electricidad',
  '5to. PCB'
]

const GRADOS_FIN_SEMANA = [
  '1ro. Basico',
  '2do. Básico',
  '3ro. Básico',
  '1er. Año - Básico por Madurez',
  '2do. Año - Basico por Madurez',
  '4to. BACO Comercial',
  '5to. BACO Comercial',
  '4to. PCB en Compu',
  '5to. PCB en Compu',
  '6to. PCB en Compu',
  'BACH por Madurez'
]

const JORNADAS = ['Matutina', 'Vespertina']

const MODALIDADES = ['Diario', 'Fin de semana', 'Curso extra']

const TIPOS_ESTUDIANTE = ['REGULAR', 'CURSO']

function RegistrarEstudiante() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [cursosExtra, setCursosExtra] = useState([])
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    telefono_estudiante: '',
    nombre_encargado: '',
    telefono_encargado: '',
    grado: '',
    jornada: '',
    modalidad: '',
    fecha_nacimiento: '',
    tipo_estudiante: 'REGULAR',
    curso_extra_id: ''
  })

  // Cargar cursos extra al montar el componente
  useEffect(() => {
    const cargarCursosExtra = async () => {
      try {
        const { data } = await obtenerCursosExtra()
        // La API devuelve { success: true, data: [...] }
        setCursosExtra(data.data || data || [])
      } catch (error) {
        console.error('Error cargando cursos extra:', error)
        setCursosExtra([])
      }
    }
    cargarCursosExtra()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value,
        // Si cambia tipo_estudiante a CURSO, limpiar grado
        ...(name === 'tipo_estudiante' && value === 'CURSO' ? { grado: '' } : {})
      }
      
      // Si cambia modalidad, resetear jornada y grado
      if (name === 'modalidad') {
        newData.grado = ''
        if (value === 'Fin de semana') {
          newData.jornada = 'Completa' // Automático para fin de semana
        } else {
          newData.jornada = ''
        }
      }
      
      // Si cambia jornada, resetear grado
      if (name === 'jornada') {
        newData.grado = ''
      }
      
      return newData
    })
  }

  // Función para obtener los grados disponibles según modalidad y jornada
  const getGradosDisponibles = () => {
    if (formData.modalidad === 'Fin de semana') {
      return GRADOS_FIN_SEMANA
    }
    if (formData.modalidad === 'Diario') {
      if (formData.jornada === 'Matutina') {
        return GRADOS_MATUTINA
      }
      if (formData.jornada === 'Vespertina') {
        return GRADOS_VESPERTINA
      }
    }
    return []
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validaciones básicas comunes
    if (!formData.nombre || !formData.apellidos || !formData.nombre_encargado || 
        !formData.telefono_encargado || !formData.jornada || 
        !formData.modalidad || !formData.fecha_nacimiento) {
      toast.error('Por favor completa todos los campos')
      return
    }

    // Validaciones según tipo de estudiante
    if (formData.tipo_estudiante === 'CURSO') {
      // Para curso extra: debe seleccionar un curso
      if (!formData.curso_extra_id) {
        toast.error('Por favor selecciona un curso extra')
        return
      }
    } else {
      // Para estudiante regular: debe seleccionar grado
      if (!formData.grado) {
        toast.error('Por favor selecciona el grado')
        return
      }
    }

    setLoading(true)
    try {
      // Preparar datos para enviar (no enviar curso_extra_id si es null/empty)
      const dataToSend = {
        ...formData,
        curso_extra_id: formData.curso_extra_id || null
      }
      await crearEstudiante(dataToSend)
      toast.success('¡Estudiante registrado exitosamente!')
      navigate('/estudiantes')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.error || 'Error al registrar estudiante')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <i className="bi bi-person-plus-fill text-green-500"></i>
          Registrar Estudiante
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos del Estudiante */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <i className="bi bi-person-fill text-blue-500"></i>
              Datos del Estudiante
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre del estudiante"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellidos
                </label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Apellidos del estudiante"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  name="fecha_nacimiento"
                  value={formData.fecha_nacimiento}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono del Estudiante
                </label>
                <input
                  type="tel"
                  name="telefono_estudiante"
                  value={formData.telefono_estudiante}
                  onChange={handleChange}
                  maxLength="8"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Número de teléfono"
                />
              </div>
            </div>
          </div>

          {/* Datos del Encargado */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <i className="bi bi-people-fill text-purple-500"></i>
              Datos del Encargado
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Encargado
                </label>
                <input
                  type="text"
                  name="nombre_encargado"
                  value={formData.nombre_encargado}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre completo del encargado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono del Encargado
                </label>
                <input
                  type="tel"
                  name="telefono_encargado"
                  value={formData.telefono_encargado}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Número de teléfono"
                />
              </div>
            </div>
          </div>

          {/* Información Académica */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <i className="bi bi-mortarboard-fill text-yellow-500"></i>
              Información Académica
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              {/* Modalidad - PRIMERO */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modalidad
                </label>
                <select
                  name="modalidad"
                  value={formData.modalidad}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Seleccionar modalidad</option>
                  {MODALIDADES.map(modalidad => (
                    <option key={modalidad} value={modalidad}>{modalidad}</option>
                  ))}
                </select>
              </div>

              {/* Jornada - SEGUNDO (solo si modalidad es Diario) */}
              {formData.modalidad === 'Diario' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jornada
                  </label>
                  <select
                    name="jornada"
                    value={formData.jornada}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Seleccionar jornada</option>
                    {JORNADAS.map(jornada => (
                      <option key={jornada} value={jornada}>{jornada}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Grado - TERCERO (solo para estudiantes REGULAR y si modalidad está seleccionada) */}
              {formData.tipo_estudiante !== 'CURSO' && formData.modalidad && (
                formData.modalidad === 'Fin de semana' || (formData.modalidad === 'Diario' && formData.jornada)
              ) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grado
                  </label>
                  <select
                    name="grado"
                    value={formData.grado}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Seleccionar grado</option>
                    {getGradosDisponibles().map(grado => (
                      <option key={grado} value={grado}>{grado}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Tipo de Estudiante y Curso Extra */}
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Estudiante
                </label>
                <select
                  name="tipo_estudiante"
                  value={formData.tipo_estudiante}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {TIPOS_ESTUDIANTE.map(tipo => (
                    <option key={tipo} value={tipo}>
                      {tipo === 'REGULAR' ? 'Regular' : 'Curso Extra'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.tipo_estudiante === 'CURSO' ? 'Curso Extra *' : 'Curso Extra (opcional)'}
                </label>
                <select
                  name="curso_extra_id"
                  value={formData.curso_extra_id}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent bg-white ${
                    formData.tipo_estudiante === 'CURSO' 
                      ? 'border-lime-400 focus:ring-lime-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">{formData.tipo_estudiante === 'CURSO' ? 'Seleccionar curso' : 'Ninguno'}</option>
                  {cursosExtra.map(curso => (
                    <option key={curso.id} value={curso.id}>
                      {curso.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <i className={loading ? "bi bi-arrow-repeat animate-spin" : "bi bi-check-circle"}></i>
              {loading ? 'Registrando...' : 'Registrar Estudiante'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <i className="bi bi-x-circle"></i>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegistrarEstudiante
