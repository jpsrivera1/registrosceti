import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { obtenerEstudiante, actualizarEstudiante } from '../services/api'

const GRADOS = [
  'Kinder', 'Prepa', '1ro Primaria', '2do Primaria', '3ro Primaria',
  '7mo', '8vo', '9no', '4to BACO', '5to BACO', '4to PCB', '5to PCB', '6to PCB'
]

const JORNADAS = ['Matutina', 'Vespertina']
const MODALIDADES = ['Diario', 'Fin de semana', 'Curso extra']
const ESTADOS = ['Activo', 'Inactivo']

function EditarEstudiante() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    nombre_encargado: '',
    telefono_encargado: '',
    grado: '',
    jornada: '',
    modalidad: '',
    fecha_nacimiento: '',
    estado: 'Activo'
  })

  useEffect(() => {
    cargarEstudiante()
  }, [id])

  const cargarEstudiante = async () => {
    try {
      const response = await obtenerEstudiante(id)
      const data = response.data.data
      setFormData({
        nombre: data.nombre || '',
        apellidos: data.apellidos || '',
        nombre_encargado: data.nombre_encargado || '',
        telefono_encargado: data.telefono_encargado || '',
        grado: data.grado || '',
        jornada: data.jornada || '',
        modalidad: data.modalidad || '',
        fecha_nacimiento: data.fecha_nacimiento ? data.fecha_nacimiento.split('T')[0] : '',
        estado: data.estado || 'Activo'
      })
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar estudiante')
      navigate('/estudiantes')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.nombre || !formData.apellidos || !formData.nombre_encargado || 
        !formData.telefono_encargado || !formData.grado || !formData.jornada || 
        !formData.modalidad || !formData.fecha_nacimiento) {
      toast.error('Por favor completa todos los campos')
      return
    }

    setSaving(true)
    try {
      await actualizarEstudiante(id, formData)
      toast.success('¡Estudiante actualizado exitosamente!')
      navigate('/estudiantes')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.error || 'Error al actualizar estudiante')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600 flex items-center gap-2">
          <i className="bi bi-arrow-repeat animate-spin"></i>
          Cargando datos...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <i className="bi bi-pencil-square text-yellow-500"></i>
          Editar Estudiante
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
              <input
                type="date"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Encargado</label>
                <input
                  type="text"
                  name="nombre_encargado"
                  value={formData.nombre_encargado}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono del Encargado</label>
                <input
                  type="tel"
                  name="telefono_encargado"
                  value={formData.telefono_encargado}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grado</label>
                <select
                  name="grado"
                  value={formData.grado}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Seleccionar grado</option>
                  {GRADOS.map(grado => (
                    <option key={grado} value={grado}>{grado}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jornada</label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {ESTADOS.map(estado => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <i className={saving ? "bi bi-arrow-repeat animate-spin" : "bi bi-save"}></i>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/estudiantes')}
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

export default EditarEstudiante
