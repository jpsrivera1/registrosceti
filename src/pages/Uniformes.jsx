import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import {
  buscarEstudiantesUniforme,
  obtenerCategoriaEstudiante,
  obtenerTallasEstudiante,
  guardarTallas,
  obtenerCategorias,
  crearOrdenUniforme,
  obtenerOrdenesEstudiante,
  registrarPagoOrden,
  obtenerMetodosPago
} from '../services/api'

// Opciones de tallas disponibles
const TALLAS_DISPONIBLES = ['2', '4', '6', '8', '10', '12', '14', '16', 'XS', 'S', 'M', 'L', 'XL', '2XL']

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

  // Estados para órdenes de uniforme
  const [ordenes, setOrdenes] = useState([])
  const [modalOrden, setModalOrden] = useState(false)
  const [modalPago, setModalPago] = useState(false)
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null)
  const [metodosPago, setMetodosPago] = useState([])
  const [formOrden, setFormOrden] = useState({
    descripcion: '',
    total_amount: ''
  })
  const [formPago, setFormPago] = useState({
    amount: '',
    payment_method_id: ''
  })

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

      // Cargar órdenes del estudiante
      await cargarOrdenes(estudiante.id)

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
    setOrdenes([])
  }

  // Cargar métodos de pago
  useEffect(() => {
    const cargarMetodosPago = async () => {
      try {
        const response = await obtenerMetodosPago()
        setMetodosPago(response.data.data || [])
      } catch (error) {
        console.error('Error cargando métodos de pago:', error)
      }
    }
    cargarMetodosPago()
  }, [])

  // Cargar órdenes del estudiante
  const cargarOrdenes = async (studentId) => {
    try {
      const response = await obtenerOrdenesEstudiante(studentId)
      setOrdenes(response.data.data || [])
    } catch (error) {
      console.error('Error cargando órdenes:', error)
      toast.error('Error al cargar las órdenes')
    }
  }

  // Abrir modal para crear orden
  const abrirModalOrden = () => {
    setFormOrden({
      descripcion: '',
      total_amount: ''
    })
    setModalOrden(true)
  }

  // Crear nueva orden
  const handleCrearOrden = async (e) => {
    e.preventDefault()
    
    if (!formOrden.descripcion || !formOrden.total_amount) {
      toast.error('Completa todos los campos')
      return
    }

    if (parseFloat(formOrden.total_amount) <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }

    try {
      await crearOrdenUniforme({
        student_id: estudianteSeleccionado.id,
        descripcion: formOrden.descripcion,
        total_amount: parseFloat(formOrden.total_amount)
      })
      
      toast.success('Orden creada correctamente')
      setModalOrden(false)
      await cargarOrdenes(estudianteSeleccionado.id)
    } catch (error) {
      console.error('Error creando orden:', error)
      toast.error('Error al crear la orden')
    }
  }

  // Abrir modal para pagar
  const abrirModalPago = (orden) => {
    setOrdenSeleccionada(orden)
    setFormPago({
      amount: orden.pending_amount.toString(),
      payment_method_id: metodosPago[0]?.id || ''
    })
    setModalPago(true)
  }

  // Registrar pago
  const handleRegistrarPago = async (e) => {
    e.preventDefault()

    if (!formPago.amount || !formPago.payment_method_id) {
      toast.error('Completa todos los campos')
      return
    }

    const monto = parseFloat(formPago.amount)
    if (monto <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }

    if (monto > ordenSeleccionada.pending_amount) {
      toast.error('El monto no puede ser mayor al saldo pendiente')
      return
    }

    try {
      const response = await registrarPagoOrden(ordenSeleccionada.id, {
        amount: monto,
        payment_method_id: formPago.payment_method_id
      })

      toast.success('Pago registrado correctamente')
      
      // Generar recibo PDF
      generarReciboPDF(response.data.data)
      
      setModalPago(false)
      await cargarOrdenes(estudianteSeleccionado.id)
    } catch (error) {
      console.error('Error registrando pago:', error)
      toast.error(error.response?.data?.message || 'Error al registrar el pago')
    }
  }

  // Generar recibo en PDF
  const generarReciboPDF = (pago) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    
    // Encabezado
    doc.setFillColor(34, 197, 94) // Verde lime
    doc.rect(0, 0, pageWidth, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('RECIBO DE PAGO', pageWidth / 2, 15, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Orden de Uniforme', pageWidth / 2, 25, { align: 'center' })
    doc.text(`No. ${pago.receipt_number}`, pageWidth / 2, 33, { align: 'center' })
    
    // Información del estudiante
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('DATOS DEL ESTUDIANTE', 14, 50)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Nombre: ${pago.student_name}`, 14, 58)
    doc.text(`Grado: ${pago.student_grade || 'N/A'}`, 14, 64)
    doc.text(`Carnet: ${pago.student_carnet || 'N/A'}`, 14, 70)
    
    // Información de la orden
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('DETALLE DE LA ORDEN', 14, 82)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Descripción: ${ordenSeleccionada?.descripcion || ''}`, 14, 90)
    doc.text(`Monto Total: Q ${ordenSeleccionada?.total_amount?.toFixed(2) || '0.00'}`, 14, 96)
    
    // Información del pago
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('DETALLE DEL PAGO', 14, 108)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Monto Pagado: Q ${pago.amount.toFixed(2)}`, 14, 116)
    doc.text(`Método de Pago: ${pago.payment_method_name}`, 14, 122)
    doc.text(`Fecha: ${new Date(pago.payment_date).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 14, 128)
    
    // Estado de la orden después del pago
    const nuevoSaldoPendiente = ordenSeleccionada.pending_amount - pago.amount
    const nuevoSaldoPagado = ordenSeleccionada.paid_amount + pago.amount
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('ESTADO DE LA CUENTA', 14, 140)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Pagado: Q ${nuevoSaldoPagado.toFixed(2)}`, 14, 148)
    doc.text(`Pendiente: Q ${nuevoSaldoPendiente.toFixed(2)}`, 14, 154)
    
    if (nuevoSaldoPendiente === 0) {
      doc.setTextColor(34, 197, 94)
      doc.setFont('helvetica', 'bold')
      doc.text('ORDEN CANCELADA', 14, 162)
      doc.setTextColor(0, 0, 0)
    }
    
    // Footer
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 100, 100)
    doc.text('Este documento es un comprobante de pago válido', pageWidth / 2, 280, { align: 'center' })
    doc.text('Conserve este recibo para cualquier aclaración', pageWidth / 2, 285, { align: 'center' })
    
    // Guardar PDF
    doc.save(`Recibo_${pago.receipt_number}_${new Date().getTime()}.pdf`)
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

      {/* Sección de Órdenes de Pago */}
      {estudianteSeleccionado && !loading && (
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <i className="bi bi-receipt text-purple-600"></i>
              Órdenes de Pago
            </h3>
            <button
              onClick={abrirModalOrden}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
            >
              <i className="bi bi-plus-circle"></i>
              Nueva Orden
            </button>
          </div>

          {/* Lista de órdenes */}
          {ordenes.length === 0 ? (
            <div className="text-center py-12">
              <i className="bi bi-inbox text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">No hay órdenes registradas</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {ordenes.map((orden) => (
                <div
                  key={orden.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-lg mb-1">
                        {orden.descripcion}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Creada: {new Date(orden.created_at).toLocaleDateString('es-GT')}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        orden.estado === 'CERRADO'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      <i className={`bi ${orden.estado === 'CERRADO' ? 'bi-check-circle' : 'bi-clock'} mr-1`}></i>
                      {orden.estado}
                    </span>
                  </div>

                  {/* Montos */}
                  <div className="grid grid-cols-3 gap-4 mb-4 bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total</p>
                      <p className="text-lg font-bold text-gray-800">
                        Q {orden.total_amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Pagado</p>
                      <p className="text-lg font-bold text-green-600">
                        Q {orden.paid_amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Pendiente</p>
                      <p className="text-lg font-bold text-red-600">
                        Q {orden.pending_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Historial de pagos */}
                  {orden.uniform_order_payments && orden.uniform_order_payments.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Historial de Pagos ({orden.uniform_order_payments.length})
                      </p>
                      <div className="space-y-2">
                        {orden.uniform_order_payments.map((pago) => (
                          <div
                            key={pago.id}
                            className="flex items-center justify-between bg-green-50 rounded-lg p-2 text-sm"
                          >
                            <span className="text-gray-700">
                              <i className="bi bi-cash text-green-600 mr-2"></i>
                              Q {pago.amount.toFixed(2)}
                            </span>
                            <span className="text-gray-600">
                              {pago.payment_methods?.nombre || 'N/A'}
                            </span>
                            <span className="text-gray-500">
                              {new Date(pago.payment_date).toLocaleDateString('es-GT')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botón para pagar */}
                  {orden.estado === 'ABIERTO' && (
                    <button
                      onClick={() => abrirModalPago(orden)}
                      className="w-full px-4 py-2 bg-lime-600 hover:bg-lime-700 text-white rounded-lg flex items-center justify-center gap-2"
                    >
                      <i className="bi bi-wallet2"></i>
                      Registrar Pago
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Crear Orden */}
      {modalOrden && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <i className="bi bi-receipt-cutoff text-purple-600"></i>
                Nueva Orden
              </h3>
              <button
                onClick={() => setModalOrden(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="bi bi-x-lg text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleCrearOrden} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <input
                  type="text"
                  value={formOrden.descripcion}
                  onChange={(e) => setFormOrden({ ...formOrden, descripcion: e.target.value })}
                  placeholder="Ej: Prendas extras febrero"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Total (Q)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formOrden.total_amount}
                  onChange={(e) => setFormOrden({ ...formOrden, total_amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOrden(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  <i className="bi bi-check-circle"></i>
                  Crear Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Pago */}
      {modalPago && ordenSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <i className="bi bi-wallet2 text-lime-600"></i>
                Registrar Pago
              </h3>
              <button
                onClick={() => setModalPago(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="bi bi-x-lg text-2xl"></i>
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">Orden</p>
              <p className="font-semibold text-gray-800 mb-3">{ordenSeleccionada.descripcion}</p>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="font-bold">Q {ordenSeleccionada.total_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Pagado</p>
                  <p className="font-bold text-green-600">Q {ordenSeleccionada.paid_amount.toFixed(2)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Saldo Pendiente</p>
                  <p className="font-bold text-red-600 text-lg">Q {ordenSeleccionada.pending_amount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleRegistrarPago} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto a Pagar (Q)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={ordenSeleccionada.pending_amount}
                  value={formPago.amount}
                  onChange={(e) => setFormPago({ ...formPago, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago
                </label>
                <select
                  value={formPago.payment_method_id}
                  onChange={(e) => setFormPago({ ...formPago, payment_method_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500"
                  required
                >
                  <option value="">Selecciona un método</option>
                  {metodosPago.map((metodo) => (
                    <option key={metodo.id} value={metodo.id}>
                      {metodo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalPago(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-lime-600 hover:bg-lime-700 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  <i className="bi bi-check-circle"></i>
                  Registrar
                </button>
              </div>
            </form>
          </div>
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
