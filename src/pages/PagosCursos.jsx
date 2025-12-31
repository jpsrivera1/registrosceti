import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { jsPDF } from 'jspdf'
import { 
  buscarEstudiantesCursos,
  obtenerMeses,
  obtenerPagosCurso,
  registrarPagoCurso,
  obtenerResumenPagosCursos
} from '../services/api'

// Monto fijo de mensualidad para cursos (puedes ajustarlo)
const MONTO_MENSUALIDAD_CURSO = 150.00

function PagosCursos() {
  const [busqueda, setBusqueda] = useState('')
  const [estudiantes, setEstudiantes] = useState([])
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null)
  const [meses, setMeses] = useState([])
  const [historialPagos, setHistorialPagos] = useState([])
  const [resumenPagos, setResumenPagos] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [formPago, setFormPago] = useState({ mes_id: '', monto: MONTO_MENSUALIDAD_CURSO })
  const [loading, setLoading] = useState(false)
  const [buscando, setBuscando] = useState(false)

  // Cargar meses al iniciar
  useEffect(() => {
    const cargarMeses = async () => {
      try {
        const { data } = await obtenerMeses()
        setMeses(data)
      } catch (error) {
        console.error('Error al cargar meses:', error)
      }
    }
    cargarMeses()
  }, [])

  // Buscar estudiantes de cursos
  useEffect(() => {
    const buscar = async () => {
      if (busqueda.length < 2) {
        setEstudiantes([])
        return
      }

      setBuscando(true)
      try {
        const { data } = await buscarEstudiantesCursos(busqueda)
        setEstudiantes(data)
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
    
    try {
      // Cargar historial de pagos y resumen
      const [pagosRes, resumenRes] = await Promise.all([
        obtenerPagosCurso(estudiante.id),
        obtenerResumenPagosCursos(estudiante.id)
      ])
      setHistorialPagos(pagosRes.data)
      setResumenPagos(resumenRes.data)
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar pagos del estudiante')
    }
  }

  // Verificar si un mes está pagado
  const mesPagado = (mesId) => {
    return historialPagos.some(p => p.month_id === mesId)
  }

  // Obtener meses disponibles
  const mesesDisponibles = () => {
    return meses.filter(mes => !mesPagado(mes.id))
  }

  // Abrir modal de pago
  const abrirModal = () => {
    setFormPago({ 
      mes_id: '', 
      monto: MONTO_MENSUALIDAD_CURSO 
    })
    setModalAbierto(true)
  }

  // Cerrar modal
  const cerrarModal = () => {
    setModalAbierto(false)
    setFormPago({ mes_id: '', monto: MONTO_MENSUALIDAD_CURSO })
  }

  // Calcular mora (solo de febrero a octubre, después del día 5)
  const calcularMora = (mesId = null) => {
    const fechaActual = new Date()
    const diaActual = fechaActual.getDate()
    
    // El mes_id corresponde al número del mes (1=Enero, 2=Febrero, etc.)
    const mesPagar = mesId ? parseInt(mesId) : 0
    
    // Solo aplicar mora de febrero (2) a octubre (10) y después del día 5
    if (mesPagar >= 2 && mesPagar <= 10 && diaActual > 5) {
      return 30.00
    }
    return 0.00
  }

  // Calcular total con mora
  const calcularTotal = () => {
    const monto = parseFloat(formPago.monto) || 0
    const mora = calcularMora(formPago.mes_id)
    return (monto + mora).toFixed(2)
  }

  // Registrar pago
  const handleRegistrarPago = async (e) => {
    e.preventDefault()
    
    if (!formPago.mes_id) {
      toast.error('Selecciona un mes')
      return
    }

    if (!formPago.monto || parseFloat(formPago.monto) <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }

    setLoading(true)
    try {
      const mesSeleccionado = meses.find(m => m.id === parseInt(formPago.mes_id))
      const mora = calcularMora(formPago.mes_id)
      
      const { data } = await registrarPagoCurso({
        estudiante_id: estudianteSeleccionado.id,
        mes_id: parseInt(formPago.mes_id),
        monto: formPago.monto,
        mora: mora
      })

      // Actualizar historial
      setHistorialPagos(prev => [...prev, { ...data, month_id: parseInt(formPago.mes_id) }])
      
      // Actualizar resumen
      const nuevoResumen = await obtenerResumenPagosCursos(estudianteSeleccionado.id)
      setResumenPagos(nuevoResumen.data)
      
      // Generar recibo
      generarReciboPDF(data, estudianteSeleccionado, mesSeleccionado)
      
      toast.success(`¡Pago de ${mesSeleccionado.name} registrado!`)
      cerrarModal()
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.error || 'Error al registrar pago')
    } finally {
      setLoading(false)
    }
  }

  // Generar recibo PDF
  const generarReciboPDF = (datosPago, estudiante, mes) => {
    const doc = new jsPDF('p', 'mm', 'letter')
    const ancho = doc.internal.pageSize.getWidth()
    const fechaActual = new Date().toLocaleDateString('es-GT', { 
      day: '2-digit', month: 'long', year: 'numeric' 
    })

    const dibujarRecibo = (yOffset, titulo) => {
      // Marco del recibo
      doc.setDrawColor(132, 204, 22) // Verde lima
      doc.setLineWidth(0.5)
      doc.rect(10, yOffset, ancho - 20, 120)

      // Encabezado con fondo verde lima
      doc.setFillColor(132, 204, 22)
      doc.rect(10, yOffset, ancho - 20, 25, 'F')

      // Título del centro educativo
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('CENTRO EDUCATIVO TECNOLÓGICO INNOVA', ancho / 2, yOffset + 10, { align: 'center' })
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('San Martín Jilotepeque, Chimaltenango', ancho / 2, yOffset + 17, { align: 'center' })
      doc.text(titulo, ancho / 2, yOffset + 23, { align: 'center' })

      // Contenido
      doc.setTextColor(0, 0, 0)
      let y = yOffset + 35

      // Número de recibo y fecha
      doc.setFillColor(240, 250, 235)
      doc.rect(15, y - 5, ancho - 30, 12, 'F')
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`RECIBO No: ${datosPago.numero_recibo || datosPago.id?.substring(0, 8).toUpperCase()}`, 20, y + 2)
      doc.text(`Fecha: ${fechaActual}`, ancho - 80, y + 2)

      y += 18

      // Datos del estudiante
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('DATOS DEL ESTUDIANTE:', 20, y)
      y += 8

      doc.setFont('helvetica', 'normal')
      doc.text(`Nombre: ${estudiante.nombre} ${estudiante.apellidos}`, 20, y)
      y += 6
      doc.text(`Curso: ${estudiante.extra_courses?.nombre || 'N/A'}`, 20, y)
      y += 6
      doc.text(`Jornada: ${estudiante.jornada || 'N/A'}`, 20, y)
      doc.text(`Modalidad: ${estudiante.modalidad || 'N/A'}`, 100, y)

      y += 12

      // Detalles del pago
      doc.setFont('helvetica', 'bold')
      doc.text('DETALLE DEL PAGO - CURSO EXTRA:', 20, y)
      y += 8

      // Tabla de pago
      doc.setDrawColor(200, 200, 200)
      doc.line(20, y, ancho - 20, y)
      y += 6
      
      doc.setFont('helvetica', 'normal')
      doc.text('Concepto', 25, y)
      doc.text('Monto', 90, y)
      doc.text('Mora', 130, y)
      doc.text('Total', 165, y)
      
      doc.line(20, y + 2, ancho - 20, y + 2)
      y += 8

      const monto = parseFloat(datosPago.monto)
      const mora = parseFloat(datosPago.mora) || 0
      const total = monto + mora

      doc.text(`Mensualidad ${mes.name}`, 25, y)
      doc.text(`Q${monto.toFixed(2)}`, 90, y)
      
      if (mora > 0) {
        doc.setTextColor(200, 0, 0)
        doc.text(`Q${mora.toFixed(2)}`, 130, y)
      } else {
        doc.setTextColor(0, 128, 0)
        doc.text('Q0.00', 130, y)
      }
      
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'bold')
      doc.text(`Q${total.toFixed(2)}`, 165, y)

      doc.setFont('helvetica', 'normal')
      doc.line(20, y + 4, ancho - 20, y + 4)

      // Mensaje si hubo mora
      if (mora > 0) {
        y += 12
        doc.setFillColor(255, 245, 200)
        doc.rect(20, y - 4, ancho - 40, 10, 'F')
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9)
        doc.setTextColor(150, 100, 0)
        doc.text('* Se aplicó mora por pago después del día 5 del mes.', 25, y + 2)
      }

      // Espacio para sello
      y = yOffset + 95
      doc.setTextColor(0, 0, 0)
      doc.setDrawColor(150, 150, 150)
      doc.setLineDash([2, 2])
      doc.rect(ancho - 70, y, 50, 20)
      doc.setLineDash([])
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(100, 100, 100)
      doc.text('Sello', ancho - 45, y + 12, { align: 'center' })

      // Firma
      doc.setTextColor(0, 0, 0)
      doc.line(20, y + 15, 80, y + 15)
      doc.setFontSize(8)
      doc.text('Firma del receptor', 50, y + 20, { align: 'center' })
    }

    // Dibujar dos recibos
    dibujarRecibo(10, '- CONSTANCIA PAGO CURSO EXTRA -')
    dibujarRecibo(140, '- COPIA CONTRIBUYENTE -')

    // Guardar PDF
    const nombreArchivo = `Recibo_Curso_${mes.name}_${estudiante.apellidos}.pdf`
    doc.save(nombreArchivo)
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-lime-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <i className="bi bi-mortarboard-fill"></i>
          Pagos de Cursos Extra
        </h1>
        <p className="mt-2 opacity-90">
          Gestiona las mensualidades de estudiantes inscritos en cursos extra
        </p>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <i className="bi bi-search text-lime-500"></i>
          Buscar Estudiante de Curso Extra
        </h2>

        <div className="relative">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Escribe el nombre del estudiante..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
          />
          
          {buscando && (
            <div className="absolute right-3 top-3">
              <i className="bi bi-arrow-repeat animate-spin text-lime-500"></i>
            </div>
          )}

          {/* Lista de resultados */}
          {estudiantes.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {estudiantes.map(estudiante => (
                <div
                  key={estudiante.id}
                  onClick={() => seleccionarEstudiante(estudiante)}
                  className="px-4 py-3 hover:bg-lime-50 cursor-pointer border-b last:border-b-0 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {estudiante.nombre} {estudiante.apellidos}
                    </p>
                    <p className="text-sm text-gray-500">
                      {estudiante.extra_courses?.nombre || 'Sin curso'} | {estudiante.jornada}
                    </p>
                  </div>
                  <span className="bg-lime-100 text-lime-700 px-3 py-1 rounded-full text-sm font-medium">
                    Curso
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Estudiante seleccionado */}
      {estudianteSeleccionado && (
        <>
          {/* Tarjeta de estudiante */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <i className="bi bi-person-fill text-lime-500"></i>
                  {estudianteSeleccionado.nombre} {estudianteSeleccionado.apellidos}
                </h3>
                <div className="mt-2 space-y-1 text-gray-600">
                  <p><strong>Curso:</strong> {estudianteSeleccionado.extra_courses?.nombre || 'N/A'}</p>
                  <p><strong>Jornada:</strong> {estudianteSeleccionado.jornada || 'N/A'} | <strong>Modalidad:</strong> {estudianteSeleccionado.modalidad || 'N/A'}</p>
                  <p><strong>Mensualidad:</strong> <span className="text-lime-600 font-bold">Q{MONTO_MENSUALIDAD_CURSO.toFixed(2)}</span></p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEstudianteSeleccionado(null)
                  setHistorialPagos([])
                  setResumenPagos(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="bi bi-x-lg text-xl"></i>
              </button>
            </div>

            {/* Resumen de pagos */}
            {resumenPagos && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-lime-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-lime-600">{resumenPagos.meses_pagados}</p>
                  <p className="text-sm text-gray-600">Meses Pagados</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{resumenPagos.meses_pendientes}</p>
                  <p className="text-sm text-gray-600">Meses Pendientes</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">Q{parseFloat(resumenPagos.total_pagado).toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Total Pagado</p>
                </div>
              </div>
            )}
          </div>

          {/* Calendario de meses */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <i className="bi bi-calendar3 text-lime-500"></i>
                Estado de Mensualidades
              </h3>
              
              {mesesDisponibles().length > 0 && (
                <button
                  onClick={abrirModal}
                  className="bg-lime-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-lime-600 transition-colors flex items-center gap-2"
                >
                  <i className="bi bi-plus-circle"></i>
                  Registrar Pago
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {meses.map(mes => {
                const pagado = mesPagado(mes.id)
                const pagoInfo = historialPagos.find(p => p.month_id === mes.id)
                
                return (
                  <div
                    key={mes.id}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      pagado 
                        ? 'bg-lime-100 border-lime-400 text-lime-700' 
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  >
                    <i className={`bi ${pagado ? 'bi-check-circle-fill' : 'bi-circle'} text-2xl mb-2`}></i>
                    <p className="font-semibold">{mes.name}</p>
                    {pagado && pagoInfo && (
                      <p className="text-xs mt-1">
                        Q{parseFloat(pagoInfo.amount).toFixed(2)}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Historial de pagos */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <i className="bi bi-receipt text-lime-500"></i>
              Historial de Pagos
            </h3>

            {historialPagos.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                <i className="bi bi-inbox text-4xl block mb-2"></i>
                No hay pagos registrados
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Mes</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Fecha</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Total Pagado</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {historialPagos.map(pago => {
                      const mesInfo = meses.find(m => m.id === pago.month_id)
                      return (
                        <tr key={pago.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{pago.month || mesInfo?.name || 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(pago.payment_date).toLocaleDateString('es-GT')}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-lime-600">
                            Q{parseFloat(pago.amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                              {pago.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de pago */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <i className="bi bi-credit-card text-lime-500"></i>
                Registrar Pago de Curso
              </h3>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleRegistrarPago} className="space-y-4">
              {/* Mes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mes a pagar
                </label>
                <select
                  value={formPago.mes_id}
                  onChange={(e) => setFormPago(prev => ({ ...prev, mes_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent bg-white"
                >
                  <option value="">Seleccionar mes</option>
                  {mesesDisponibles().map(mes => (
                    <option key={mes.id} value={mes.id}>{mes.name}</option>
                  ))}
                </select>
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto mensualidad
                </label>
                <input
                  type="number"
                  value={formPago.monto}
                  onChange={(e) => setFormPago(prev => ({ ...prev, monto: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  step="0.01"
                />
              </div>

              {/* Mora */}
              {calcularMora(formPago.mes_id) > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm flex items-center gap-2">
                    <i className="bi bi-exclamation-triangle"></i>
                    <strong>Mora aplicada:</strong> Q{calcularMora(formPago.mes_id).toFixed(2)}
                  </p>
                  <p className="text-red-500 text-xs mt-1">
                    (Se aplica mora de febrero a octubre, después del día 5)
                  </p>
                </div>
              )}

              {/* Total */}
              <div className="bg-lime-50 border border-lime-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Total a pagar:</span>
                  <span className="text-2xl font-bold text-lime-600">
                    Q{calcularTotal()}
                  </span>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-lime-500 text-white py-3 rounded-lg font-semibold hover:bg-lime-600 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  <i className={loading ? "bi bi-arrow-repeat animate-spin" : "bi bi-check-circle"}></i>
                  {loading ? 'Registrando...' : 'Registrar Pago'}
                </button>
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PagosCursos
