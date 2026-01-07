import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  buscarEstudiantesUniforme,
  obtenerCategoriaEstudiante,
  obtenerTallasEstudiante,
  guardarTallas,
  obtenerCategorias
} from '../services/api'

// Opciones de tallas disponibles
const TALLAS_DISPONIBLES = ['6', '8', '10', '12', '14', 'XS', 'S', 'M', 'L', 'XL']

// Mapeo de iconos para cada prenda
const ICONOS_PRENDAS = {
  'playerita': 'bi-person-standing',
  'polo': 'bi-person-badge',
  'jacket': 'bi-cloud-snow',
  'sudadero': 'bi-wind',
  'pants': 'bi-rulers',
  'gorra': 'bi-cap',
  'gabacha': 'bi-briefcase',
  'cinta': 'bi-credit-card-2-front',
  'carné': 'bi-credit-card-2-front',
  't-shirt': 'bi-person-standing',
  'camisa': 'bi-person-badge',
  'lanyard': 'bi-credit-card-2-front',
  'default': 'bi-tag'
}

// Función para obtener el icono según el nombre de la prenda
const getIconoPrenda = (nombrePrenda) => {
  const nombre = nombrePrenda.toLowerCase()
  for (const [key, icon] of Object.entries(ICONOS_PRENDAS)) {
    if (nombre.includes(key)) return icon
  }
  return ICONOS_PRENDAS.default
}

function Uniformes() {
  const [busqueda, setBusqueda] = useState('')
  const [estudiantes, setEstudiantes] = useState([])
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [tallasRegistradas, setTallasRegistradas] = useState([])
  const [tallasForm, setTallasForm] = useState({})
  const [cantidadesForm, setCantidadesForm] = useState({}) // Nuevo estado para cantidades
  const [loading, setLoading] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [todasCategorias, setTodasCategorias] = useState([])

  // Cargar todas las categorías al inicio
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const response = await obtenerCategorias()
        setTodasCategorias(response.data.data || [])
      } catch (error) {
        console.error('Error cargando categorías:', error)
      }
    }
    cargarCategorias()
  }, [])

  // Buscar estudiantes
  useEffect(() => {
    const buscar = async () => {
      if (busqueda.length < 2) {
        setEstudiantes([])
        return
      }

      setBuscando(true)
      try {
        const response = await buscarEstudiantesUniforme(busqueda)
        setEstudiantes(response.data)
      } catch (error) {
        console.error(error)
      } finally {
        setBuscando(false)
      }
    }

    const timeoutId = setTimeout(buscar, 300)
    return () => clearTimeout(timeoutId)
  }, [busqueda])

  // Seleccionar estudiante
  const seleccionarEstudiante = async (estudiante) => {
    setEstudianteSeleccionado(estudiante)
    setBusqueda('')
    setEstudiantes([])
    setLoading(true)

    try {
      // Obtener categoría según nivel del estudiante
      const resCat = await obtenerCategoriaEstudiante(estudiante.id)
      
      // Si viene un array, mostrar todas las categorías
      if (Array.isArray(resCat.data.data)) {
        setCategorias(resCat.data.data)
      } else {
        setCategorias([resCat.data.data])
      }

      // Obtener tallas ya registradas
      const resTallas = await obtenerTallasEstudiante(estudiante.id)
      setTallasRegistradas(resTallas.data.data || [])

      // Inicializar formulario con tallas y cantidades existentes
      const tallasExistentes = {}
      const cantidadesExistentes = {}
      resTallas.data.data?.forEach(t => {
        tallasExistentes[t.uniform_items.id] = t.talla
        cantidadesExistentes[t.uniform_items.id] = t.cantidad || 1
      })
      setTallasForm(tallasExistentes)
      setCantidadesForm(cantidadesExistentes)

    } catch (error) {
      console.error(error)
      toast.error('Error al cargar información del estudiante')
    } finally {
      setLoading(false)
    }
  }

  // Cambiar selección de talla
  const handleTallaChange = (itemId, talla) => {
    setTallasForm(prev => ({
      ...prev,
      [itemId]: talla
    }))
  }

  // Cambiar cantidad de prenda
  const handleCantidadChange = (itemId, cantidad) => {
    setCantidadesForm(prev => ({
      ...prev,
      [itemId]: parseInt(cantidad) || 1
    }))
  }

  // Guardar tallas
  const handleGuardarTallas = async () => {
    // Filtrar solo las tallas que tienen valor
    const tallasAGuardar = Object.entries(tallasForm)
      .filter(([_, talla]) => talla && talla !== '')
      .map(([itemId, talla]) => ({
        item_id: itemId,
        talla: talla,
        cantidad: cantidadesForm[itemId] || 1
      }))

    if (tallasAGuardar.length === 0) {
      toast.error('Selecciona al menos una talla')
      return
    }

    setGuardando(true)
    try {
      await guardarTallas(estudianteSeleccionado.id, tallasAGuardar)
      toast.success('Tallas guardadas correctamente')
      
      // Actualizar tallas registradas
      const resTallas = await obtenerTallasEstudiante(estudianteSeleccionado.id)
      setTallasRegistradas(resTallas.data.data || [])
    } catch (error) {
      console.error(error)
      toast.error('Error al guardar las tallas')
    } finally {
      setGuardando(false)
    }
  }

  // Limpiar selección
  const limpiarSeleccion = () => {
    setEstudianteSeleccionado(null)
    setCategorias([])
    setTallasRegistradas([])
    setTallasForm({})
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-2">
          <i className="bi bi-person-vcard text-lime-500"></i>
          Tallas de Uniforme
        </h1>
        <p className="text-gray-600">
          Busca un estudiante y registra las tallas de su uniforme según su categoría
        </p>
      </div>

      {/* Buscador de estudiantes */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <i className="bi bi-search text-blue-600"></i>
          Buscar Estudiante
        </h2>

        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Escribe el nombre del estudiante..."
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                disabled={estudianteSeleccionado}
              />
              <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
            {estudianteSeleccionado && (
              <button
                onClick={limpiarSeleccion}
                className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2"
              >
                <i className="bi bi-x-lg"></i>
                Limpiar
              </button>
            )}
          </div>

          {/* Lista de resultados */}
          {estudiantes.length > 0 && !estudianteSeleccionado && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {estudiantes.map((est) => (
                <div
                  key={est.id}
                  onClick={() => seleccionarEstudiante(est)}
                  className="px-4 py-3 hover:bg-lime-50 cursor-pointer border-b last:border-b-0 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-800">{est.nombre_completo}</p>
                    <p className="text-sm text-gray-500">{est.nivel}</p>
                  </div>
                  <i className="bi bi-chevron-right text-gray-400"></i>
                </div>
              ))}
            </div>
          )}

          {buscando && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
              <i className="bi bi-arrow-repeat animate-spin mr-2"></i>
              Buscando...
            </div>
          )}
        </div>
      </div>

      {/* Estudiante seleccionado */}
      {estudianteSeleccionado && (
        <div className="bg-gradient-to-r from-lime-500 to-green-600 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <i className="bi bi-person-fill text-3xl"></i>
            </div>
            <div>
              <h3 className="text-2xl font-bold">{estudianteSeleccionado.nombre_completo}</h3>
              <p className="text-lime-100">
                <i className="bi bi-mortarboard mr-2"></i>
                {estudianteSeleccionado.nivel}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de tallas */}
      {loading && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <i className="bi bi-arrow-repeat animate-spin text-4xl text-lime-500"></i>
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      )}

      {!loading && estudianteSeleccionado && categorias.length > 0 && (
        <div className="space-y-6">
          {categorias.map((categoria) => (
            <div key={categoria.id} className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <i className="bi bi-tags text-lime-500"></i>
                {categoria.nombre}
              </h3>
              {categoria.descripcion && (
                <p className="text-gray-500 mb-4">{categoria.descripcion}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoria.uniform_items?.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-lime-400 transition-colors"
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className={`bi ${getIconoPrenda(item.nombre)} mr-2 text-lime-500`}></i>
                      {item.nombre}
                    </label>
                    
                    {/* Select de talla */}
                    <select
                      value={tallasForm[item.id] || ''}
                      onChange={(e) => handleTallaChange(item.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent mb-2"
                    >
                      <option value="">-- Seleccionar talla --</option>
                      {TALLAS_DISPONIBLES.map((talla) => (
                        <option key={talla} value={talla}>
                          {talla}
                        </option>
                      ))}
                    </select>

                    {/* Input de cantidad */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">Cantidad:</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={cantidadesForm[item.id] || 1}
                        onChange={(e) => handleCantidadChange(item.id, e.target.value)}
                        className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                      />
                    </div>
                    
                    {tallasForm[item.id] && (
                      <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                        <i className="bi bi-check-circle"></i>
                        Talla seleccionada: {tallasForm[item.id]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Botón guardar */}
          <div className="flex justify-end">
            <button
              onClick={handleGuardarTallas}
              disabled={guardando}
              className="px-6 py-3 bg-lime-500 hover:bg-lime-600 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando ? (
                <>
                  <i className="bi bi-arrow-repeat animate-spin"></i>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle"></i>
                  Guardar Tallas
                </>
              )}
            </button>
          </div>

          {/* Tallas registradas */}
          {tallasRegistradas.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i className="bi bi-list-check text-green-600"></i>
                Tallas Registradas
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Prenda</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Categoría</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Talla</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Cantidad</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Fecha Registro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tallasRegistradas.map((talla) => (
                      <tr key={talla.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-800">
                          <i className={`bi ${getIconoPrenda(talla.uniform_items?.nombre || '')} text-lime-500 mr-2`}></i>
                          {talla.uniform_items?.nombre}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {talla.uniform_items?.uniform_categories?.nombre}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-3 py-1 bg-lime-100 text-lime-700 rounded-full font-medium">
                            {talla.talla}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                            {talla.cantidad || 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-sm">
                          {new Date(talla.fecha_registro).toLocaleDateString('es-GT')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mensaje cuando no hay estudiante seleccionado */}
      {!estudianteSeleccionado && !loading && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <i className="bi bi-person-vcard text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-xl font-medium text-gray-600 mb-2">
            Selecciona un estudiante
          </h3>
          <p className="text-gray-400">
            Busca y selecciona un estudiante para ver y registrar las tallas de su uniforme
          </p>
        </div>
      )}
    </div>
  )
}

export default Uniformes
