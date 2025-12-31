import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { obtenerEstudiantes, eliminarEstudiante } from '../services/api'

function ListaEstudiantes() {
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGrado, setFilterGrado] = useState('')
  const [filterJornada, setFilterJornada] = useState('')
  const [filterModalidad, setFilterModalidad] = useState('')

  const GRADOS = [
    'Kinder', 'Prepa', '1ro Primaria', '2do Primaria', '3ro Primaria',
    '7mo', '8vo', '9no', '4to BACO', '5to BACO', '4to PCB', '5to PCB', '6to PCB'
  ]

  const JORNADAS = ['Matutina', 'Vespertina']
  const MODALIDADES = ['Diario', 'Fin de semana', 'Curso extra']

  useEffect(() => {
    cargarEstudiantes()
  }, [])

  const cargarEstudiantes = async () => {
    try {
      const response = await obtenerEstudiantes()
      setEstudiantes(response.data.data || [])
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar estudiantes')
    } finally {
      setLoading(false)
    }
  }

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${nombre}?`)) return

    try {
      await eliminarEstudiante(id)
      toast.success('Estudiante eliminado')
      cargarEstudiantes()
    } catch (error) {
      console.error(error)
      toast.error('Error al eliminar estudiante')
    }
  }

  const estudiantesFiltrados = estudiantes.filter(est => {
    const matchSearch = est.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       est.apellidos.toLowerCase().includes(searchTerm.toLowerCase())
    const matchGrado = filterGrado ? est.grado === filterGrado : true
    const matchJornada = filterJornada ? est.jornada === filterJornada : true
    const matchModalidad = filterModalidad ? est.modalidad === filterModalidad : true
    return matchSearch && matchGrado && matchJornada && matchModalidad
  })

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-GT')
  }

  // Función para exportar a Excel con hojas separadas
  const exportarExcel = () => {
    if (estudiantesFiltrados.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    // Preparar datos para el Excel
    const datosExcel = estudiantesFiltrados.map((est, index) => ({
      'No.': index + 1,
      'Nombre': est.nombre,
      'Apellidos': est.apellidos,
      'Fecha Nacimiento': formatDate(est.fecha_nacimiento),
      'Grado': est.grado,
      'Jornada': est.jornada,
      'Modalidad': est.modalidad,
      'Nombre Encargado': est.nombre_encargado,
      'Teléfono Encargado': est.telefono_encargado,
      'Estado': est.estado,
      'Fecha Registro': formatDate(est.fecha_registro)
    }))

    // Crear libro de trabajo
    const wb = XLSX.utils.book_new()
    
    // Hoja con todos los estudiantes
    const wsAll = XLSX.utils.json_to_sheet(datosExcel)
    XLSX.utils.book_append_sheet(wb, wsAll, 'Todos los Estudiantes')

    // Crear hojas separadas por grado
    const estudiantesPorGrado = {}
    estudiantesFiltrados.forEach(est => {
      if (!estudiantesPorGrado[est.grado]) {
        estudiantesPorGrado[est.grado] = []
      }
      estudiantesPorGrado[est.grado].push(est)
    })

    Object.keys(estudiantesPorGrado).sort().forEach(grado => {
      const datosGrado = estudiantesPorGrado[grado].map((est, index) => ({
        'No.': index + 1,
        'Nombre': est.nombre,
        'Apellidos': est.apellidos,
        'Fecha Nacimiento': formatDate(est.fecha_nacimiento),
        'Jornada': est.jornada,
        'Modalidad': est.modalidad,
        'Nombre Encargado': est.nombre_encargado,
        'Teléfono Encargado': est.telefono_encargado,
        'Estado': est.estado
      }))
      const wsGrado = XLSX.utils.json_to_sheet(datosGrado)
      const nombreHoja = grado.replace(/[\\/*?:\[\]]/g, '').substring(0, 31)
      XLSX.utils.book_append_sheet(wb, wsGrado, nombreHoja)
    })

    // Crear hojas separadas por jornada
    const estudiantesPorJornada = {}
    estudiantesFiltrados.forEach(est => {
      if (!estudiantesPorJornada[est.jornada]) {
        estudiantesPorJornada[est.jornada] = []
      }
      estudiantesPorJornada[est.jornada].push(est)
    })

    Object.keys(estudiantesPorJornada).forEach(jornada => {
      const datosJornada = estudiantesPorJornada[jornada].map((est, index) => ({
        'No.': index + 1,
        'Nombre Completo': `${est.nombre} ${est.apellidos}`,
        'Grado': est.grado,
        'Modalidad': est.modalidad,
        'Encargado': est.nombre_encargado,
        'Teléfono': est.telefono_encargado
      }))
      const wsJornada = XLSX.utils.json_to_sheet(datosJornada)
      XLSX.utils.book_append_sheet(wb, wsJornada, `Jornada ${jornada}`)
    })

    // Crear hojas separadas por modalidad
    const estudiantesPorModalidad = {}
    estudiantesFiltrados.forEach(est => {
      if (!estudiantesPorModalidad[est.modalidad]) {
        estudiantesPorModalidad[est.modalidad] = []
      }
      estudiantesPorModalidad[est.modalidad].push(est)
    })

    Object.keys(estudiantesPorModalidad).forEach(modalidad => {
      const datosModalidad = estudiantesPorModalidad[modalidad].map((est, index) => ({
        'No.': index + 1,
        'Nombre Completo': `${est.nombre} ${est.apellidos}`,
        'Grado': est.grado,
        'Jornada': est.jornada,
        'Encargado': est.nombre_encargado,
        'Teléfono': est.telefono_encargado
      }))
      const wsModalidad = XLSX.utils.json_to_sheet(datosModalidad)
      const nombreHoja = modalidad.replace(/[\\/*?:\[\]]/g, '').substring(0, 31)
      XLSX.utils.book_append_sheet(wb, wsModalidad, nombreHoja)
    })

    // Generar archivo y descargar
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const fecha = new Date().toLocaleDateString('es-GT').replace(/\//g, '-')
    saveAs(data, `Reporte_Estudiantes_${fecha}.xlsx`)
    
    toast.success('Reporte Excel generado exitosamente')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600 flex items-center gap-2">
          <i className="bi bi-arrow-repeat animate-spin"></i>
          Cargando estudiantes...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <i className="bi bi-people-fill text-blue-500"></i>
            Lista de Estudiantes
          </h1>
          <div className="flex gap-2">
            <button
              onClick={exportarExcel}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <i className="bi bi-file-earmark-excel"></i>
              Exportar Excel
            </button>
            <Link
              to="/registrar"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <i className="bi bi-plus-circle"></i>
              Nuevo Estudiante
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterGrado}
            onChange={(e) => setFilterGrado(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Todos los grados</option>
            {GRADOS.map(grado => (
              <option key={grado} value={grado}>{grado}</option>
            ))}
          </select>
          <select
            value={filterJornada}
            onChange={(e) => setFilterJornada(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Todas las jornadas</option>
            {JORNADAS.map(jornada => (
              <option key={jornada} value={jornada}>{jornada}</option>
            ))}
          </select>
          <select
            value={filterModalidad}
            onChange={(e) => setFilterModalidad(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Todas las modalidades</option>
            {MODALIDADES.map(modalidad => (
              <option key={modalidad} value={modalidad}>{modalidad}</option>
            ))}
          </select>
        </div>

        {/* Contador */}
        <div className="mb-4 text-gray-600 flex items-center gap-2">
          <i className="bi bi-info-circle"></i>
          Mostrando {estudiantesFiltrados.length} de {estudiantes.length} estudiantes
        </div>

        {/* Tabla */}
        {estudiantesFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <i className="bi bi-inbox text-6xl mb-4 block"></i>
            <p className="text-xl">No se encontraron estudiantes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    <i className="bi bi-person me-1"></i>Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    <i className="bi bi-bookmark me-1"></i>Grado
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    <i className="bi bi-clock me-1"></i>Jornada
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    <i className="bi bi-calendar-check me-1"></i>Modalidad
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    <i className="bi bi-person-badge me-1"></i>Encargado
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    <i className="bi bi-telephone me-1"></i>Teléfono
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    <i className="bi bi-toggle-on me-1"></i>Estado
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    <i className="bi bi-gear me-1"></i>Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {estudiantesFiltrados.map((estudiante) => (
                  <tr key={estudiante.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {estudiante.nombre} {estudiante.apellidos}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <i className="bi bi-calendar-event"></i>
                        {formatDate(estudiante.fecha_nacimiento)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {estudiante.grado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{estudiante.jornada}</td>
                    <td className="px-4 py-3 text-gray-700">{estudiante.modalidad}</td>
                    <td className="px-4 py-3 text-gray-700">{estudiante.nombre_encargado}</td>
                    <td className="px-4 py-3 text-gray-700">{estudiante.telefono_encargado}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1 w-fit ${
                        estudiante.estado === 'Activo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <i className={estudiante.estado === 'Activo' ? 'bi bi-check-circle' : 'bi bi-x-circle'}></i>
                        {estudiante.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <Link
                          to={`/editar/${estudiante.id}`}
                          className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-sm flex items-center gap-1"
                        >
                          <i className="bi bi-pencil"></i>
                          Editar
                        </Link>
                        <button
                          onClick={() => handleEliminar(estudiante.id, estudiante.nombre)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm flex items-center gap-1"
                        >
                          <i className="bi bi-trash"></i>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ListaEstudiantes
