import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { jsPDF } from 'jspdf'
import { 
  buscarEstudiantesPago, 
  obtenerPagosEstudiante, 
  guardarPago,
  obtenerColegiaturas,
  registrarColegiatura,
  obtenerMeses,
  obtenerPagosCurso,
  registrarPagoCurso,
  obtenerMetodosPago,
  obtenerPagoGraduacion,
  guardarPagoGraduacion
} from '../services/api'

// Configuración de tipos de pago (colegiatura se maneja aparte)
const TIPOS_PAGO = [
  { key: 'inscripcion', nombre: 'Pago Inscripción', icono: 'bi-clipboard-check', color: 'blue' },
  { key: 'uniforme', nombre: 'Pago Uniforme', icono: 'bi-person-badge', color: 'green' },
  { key: 'libros_lectura', nombre: 'Pago Libros de Lectura', icono: 'bi-book', color: 'purple' },
  { key: 'copias_anuales', nombre: 'Pago Copias Anuales', icono: 'bi-files', color: 'orange' },
  { key: 'libro_ingles', nombre: 'Pago Libro de Inglés', icono: 'bi-translate', color: 'red' },
  { key: 'excursion', nombre: 'Pago Excursión', icono: 'bi-bus-front', color: 'teal' },
  { key: 'especialidad', nombre: 'Pago Especialidad', icono: 'bi-award', color: 'pink' }
]

// Grados que aplican para graduación (verificación flexible)
const GRADOS_GRADUACION = [
  '9NO', '9no',
  '3RO BÁSICO', '3ro Básico', '3ro. Básico',
  '2DO. AÑO - BÁSICO POR MADUREZ', '2do. Año - Basico por Madurez',
  '5TO BACH EN DISEÑO', '5to BACH en Diseño', '5to. BACH en Diseño',
  '5TO BACH EN MECÁNICA', '5to. BACH en Mecánica',
  '5TO BACH EN ELECTRICIDAD', '5to. BACH en Electricidad',
  '5TO BACO', '5to BACO',
  '5TO BACO COMERCIAL', '5to. BACO Comercial',
  '5TO BACH EN CC Y LL', '5to BACH en CC y LL',
  '5TO BACH CON ORIENTACIÓN EN EDUCACIÓN', '5to BACH con orientación en Educación',
  'BACH POR MADUREZ', 'BACH por Madurez',
  '6TO PCB', '6to PCB',
  '6TO PCB EN COMPU', '6to. PCB en Compu',
  '6TO FCB', '6to FCB',
  'PREPA'
]

const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE']

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200 border-blue-300',
  green: 'bg-green-100 text-green-600 hover:bg-green-200 border-green-300',
  purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200 border-purple-300',
  orange: 'bg-orange-100 text-orange-600 hover:bg-orange-200 border-orange-300',
  red: 'bg-red-100 text-red-600 hover:bg-red-200 border-red-300',
  teal: 'bg-teal-100 text-teal-600 hover:bg-teal-200 border-teal-300',
  pink: 'bg-pink-100 text-pink-600 hover:bg-pink-200 border-pink-300',
  yellow: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-400'
}

function Pagos() {
  const [busqueda, setBusqueda] = useState('')
  const [estudiantes, setEstudiantes] = useState([])
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null)
  const [pagos, setPagos] = useState({})
  const [modalAbierto, setModalAbierto] = useState(false)
  const [tipoPagoSeleccionado, setTipoPagoSeleccionado] = useState(null)
  const [formPago, setFormPago] = useState({ monto_total: '', monto_abono: '', payment_method_id: '' })
  const [loading, setLoading] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [modoAbono, setModoAbono] = useState(false) // true cuando se paga el pendiente

  // Estados para métodos de pago
  const [metodosPago, setMetodosPago] = useState([])

  // Estados para colegiatura
  const [modalColegiatura, setModalColegiatura] = useState(false)
  const [historialColegiaturas, setHistorialColegiaturas] = useState([])
  const [formColegiatura, setFormColegiatura] = useState({ mes: '', monto_colegiatura: '', payment_method_id: '' })
  const [loadingColegiatura, setLoadingColegiatura] = useState(false)

  // Estados para pago de curso extra
  const [modalPagoCurso, setModalPagoCurso] = useState(false)
  const [historialPagosCurso, setHistorialPagosCurso] = useState([])
  const [mesesCursoExtra, setMesesCursoExtra] = useState([])
  const [formPagoCurso, setFormPagoCurso] = useState({ month_id: '', amount: '', payment_method_id: '' })
  const [loadingPagoCurso, setLoadingPagoCurso] = useState(false)

  // Estados para graduación
  const [modalGraduacion, setModalGraduacion] = useState(false)
  const [pagoGraduacion, setPagoGraduacion] = useState(null)
  const [aplicaGraduacion, setAplicaGraduacion] = useState(false)
  const [formGraduacion, setFormGraduacion] = useState({ total_amount: '', paid_amount: '', payment_method_id: '' })
  const [loadingGraduacion, setLoadingGraduacion] = useState(false)
  const [modoAbonoGraduacion, setModoAbonoGraduacion] = useState(false)

  const MONTO_CURSO_EXTRA = 150 // Monto fijo para cursos extra

  // Cargar métodos de pago al iniciar
  useEffect(() => {
    const cargarMetodosPago = async () => {
      try {
        const response = await obtenerMetodosPago()
        setMetodosPago(response.data)
      } catch (error) {
        console.error('Error al cargar métodos de pago:', error)
      }
    }
    cargarMetodosPago()
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
        const response = await buscarEstudiantesPago(busqueda)
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
    console.log('Estudiante seleccionado:', estudiante)
    console.log('curso_extra_id:', estudiante.curso_extra_id)
    console.log('extra_courses:', estudiante.extra_courses)
    
    setEstudianteSeleccionado(estudiante)
    setBusqueda('')
    setEstudiantes([])
    
    try {
      const response = await obtenerPagosEstudiante(estudiante.id)
      setPagos(response.data)
      
      // Cargar historial de colegiaturas
      const resColegiatura = await obtenerColegiaturas(estudiante.id)
      setHistorialColegiaturas(resColegiatura.data)

      // Verificar si aplica para graduación (por grado, cualquier modalidad/jornada)
      const gradoEstudiante = (estudiante.grado || '').trim()
      console.log('🎓 Grado del estudiante:', gradoEstudiante)
      
      // Normalizar eliminando puntos para comparación flexible
      const gradoNormalizado = gradoEstudiante.toUpperCase().replace(/\./g, '')
      const aplicaParaGraduacion = GRADOS_GRADUACION.some(grado => {
        const gradoListaNormalizado = grado.toUpperCase().replace(/\./g, '')
        return gradoNormalizado.includes(gradoListaNormalizado)
      })
      
      console.log('🎓 ¿Aplica para graduación?', aplicaParaGraduacion)
      
      if (aplicaParaGraduacion) {
        try {
          const resGraduacion = await obtenerPagoGraduacion(estudiante.id)
          console.log('🎓 Respuesta del backend:', resGraduacion.data)
          setAplicaGraduacion(resGraduacion.data.aplica)
          setPagoGraduacion(resGraduacion.data.pago)
        } catch (err) {
          console.error('Error al obtener pago graduación:', err)
          setAplicaGraduacion(true) // Mostrar tarjeta aunque falle la consulta
          setPagoGraduacion(null)
        }
      } else {
        setAplicaGraduacion(false)
        setPagoGraduacion(null)
      }

      // Si tiene curso extra, cargar pagos del curso
      if (estudiante.curso_extra_id) {
        console.log('Cargando datos del curso extra...')
        const [resMeses, resPagosCurso] = await Promise.all([
          obtenerMeses(),
          obtenerPagosCurso(estudiante.id)
        ])
        console.log('Meses:', resMeses.data)
        console.log('Pagos curso:', resPagosCurso.data)
        setMesesCursoExtra(resMeses.data?.data || resMeses.data || [])
        setHistorialPagosCurso(resPagosCurso.data?.data || resPagosCurso.data || [])
      } else {
        setMesesCursoExtra([])
        setHistorialPagosCurso([])
      }
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar pagos del estudiante')
    }
  }

  // Abrir modal de pago normal
  const abrirModal = (tipoPago) => {
    setTipoPagoSeleccionado(tipoPago)
    const pagoExistente = pagos[tipoPago.key]
    
    if (pagoExistente && parseFloat(pagoExistente.monto_pendiente) > 0) {
      // Si hay pendiente, modo abono - solo pagar lo que falta
      setModoAbono(true)
      setFormPago({
        monto_total: pagoExistente.monto_total,
        monto_abono: pagoExistente.monto_pendiente, // Por defecto pagar todo el pendiente
        payment_method_id: ''
      })
    } else if (pagoExistente && parseFloat(pagoExistente.monto_pendiente) === 0) {
      // Ya está pagado completamente
      setModoAbono(false)
      setFormPago({
        monto_total: pagoExistente.monto_total,
        monto_abono: pagoExistente.monto_adelanto,
        payment_method_id: ''
      })
    } else {
      // Nuevo pago
      setModoAbono(false)
      setFormPago({ monto_total: '', monto_abono: '', payment_method_id: '' })
    }
    setModalAbierto(true)
  }

  // Cerrar modal normal
  const cerrarModal = () => {
    setModalAbierto(false)
    setTipoPagoSeleccionado(null)
    setFormPago({ monto_total: '', monto_abono: '', payment_method_id: '' })
    setModoAbono(false)
  }

  // Guardar pago normal
  const handleGuardarPago = async (e) => {
    e.preventDefault()
    
    const montoAbono = parseFloat(formPago.monto_abono || 0)
    const montoTotal = parseFloat(formPago.monto_total || 0)
    const pagoExistente = pagos[tipoPagoSeleccionado.key]
    const pendienteActual = pagoExistente ? parseFloat(pagoExistente.monto_pendiente) : 0

    if (!formPago.payment_method_id) {
      toast.error('Seleccione una forma de pago')
      return
    }

    if (!modoAbono) {
      // Nuevo registro o edición
      if (!formPago.monto_total || montoTotal <= 0) {
        toast.error('El monto total debe ser mayor a 0')
        return
      }
      if (montoAbono > montoTotal) {
        toast.error('El abono no puede ser mayor al monto total')
        return
      }
    } else {
      // Pago del pendiente
      if (montoAbono <= 0) {
        toast.error('El monto a abonar debe ser mayor a 0')
        return
      }
      if (montoAbono > pendienteActual) {
        toast.error('El abono no puede ser mayor al pendiente')
        return
      }
    }

    setLoading(true)
    try {
      const response = await guardarPago(
        estudianteSeleccionado.id,
        tipoPagoSeleccionado.key,
        {
          monto_total: formPago.monto_total,
          monto_abono: formPago.monto_abono,
          es_pago_pendiente: modoAbono,
          payment_method_id: parseInt(formPago.payment_method_id)
        }
      )
      
      // Actualizar estado de pagos
      setPagos(prev => ({
        ...prev,
        [tipoPagoSeleccionado.key]: response.data.pago
      }))
      
      // Generar recibo PDF
      generarReciboPagoNormal(
        response.data,
        estudianteSeleccionado,
        tipoPagoSeleccionado
      )
      
      if (response.data.estaCancelado) {
        toast.success('¡Pago completado! Se ha cancelado el total.')
      } else {
        toast.success('Abono registrado correctamente')
      }
      
      cerrarModal()
    } catch (error) {
      console.error(error)
      toast.error('Error al guardar el pago')
    } finally {
      setLoading(false)
    }
  }

  // Generar recibo PDF para pagos normales
  const generarReciboPagoNormal = (datosResponse, estudiante, tipoPago) => {
    const doc = new jsPDF('p', 'mm', 'letter')
    const ancho = doc.internal.pageSize.getWidth()
    const fechaActual = new Date().toLocaleDateString('es-GT', { 
      day: '2-digit', month: 'long', year: 'numeric' 
    })

    const dibujarReciboPago = (yOffset, titulo) => {
      // Marco del recibo
      doc.setDrawColor(0, 0, 0) // Negro
      doc.setLineWidth(0.5)
      doc.rect(10, yOffset, ancho - 20, 120)

      // Encabezado con borde
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(1)
      doc.rect(10, yOffset, ancho - 20, 25)

      // Título del centro educativo
      doc.setTextColor(0, 0, 0)
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
      doc.setDrawColor(0, 0, 0)
      doc.rect(15, y - 5, ancho - 30, 12)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`RECIBO No: ${datosResponse.numeroRecibo}`, 20, y + 2)
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
      doc.text(`Grado: ${estudiante.grado || 'N/A'}`, 20, y)
      doc.text(`Jornada: ${estudiante.jornada || 'N/A'}`, 100, y)
      y += 6
      doc.text(`Modalidad: ${estudiante.modalidad || 'N/A'}`, 20, y)
      // Forma de pago
      doc.setFont('helvetica', 'bold')
      doc.text(`Forma de Pago: ${datosResponse.metodo_pago || 'N/A'}`, 100, y)
      doc.setFont('helvetica', 'normal')

      y += 12

      // Detalles del pago
      doc.setFont('helvetica', 'bold')
      doc.text('DETALLE DEL PAGO:', 20, y)
      y += 8

      // Tabla de pago
      doc.setDrawColor(0, 0, 0)
      doc.line(20, y, ancho - 20, y)
      y += 6
      
      doc.setFont('helvetica', 'normal')
      doc.text('Concepto', 25, y)
      doc.text('Monto Total', 90, y)
      doc.text('Abono', 130, y)
      doc.text('Pendiente', 165, y)
      
      doc.line(20, y + 2, ancho - 20, y + 2)
      y += 8

      const pago = datosResponse.pago
      doc.text(datosResponse.tipoPago, 25, y)
      doc.text(`Q${parseFloat(pago.monto_total).toFixed(2)}`, 90, y)
      doc.text(`Q${parseFloat(datosResponse.montoAbonado).toFixed(2)}`, 130, y)
      
      // Pendiente
      if (parseFloat(pago.monto_pendiente) === 0) {
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'bold')
        doc.text('CANCELADO', 165, y)
      } else {
        doc.setTextColor(0, 0, 0)
        doc.text(`Q${parseFloat(pago.monto_pendiente).toFixed(2)}`, 165, y)
      }

      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'normal')
      doc.line(20, y + 4, ancho - 20, y + 4)

      // Si es abono, mostrar historial
      if (datosResponse.esAbono) {
        y += 12
        doc.setDrawColor(0, 0, 0)
        doc.rect(20, y - 4, ancho - 40, 10)
        doc.setFont('helvetica', 'italic')
        doc.text(`Este recibo corresponde a un ABONO. Total abonado hasta la fecha: Q${parseFloat(pago.monto_adelanto).toFixed(2)}`, 25, y + 2)
      }

      // Espacio para sello
      y = yOffset + 95
      doc.setDrawColor(0, 0, 0)
      doc.setLineDash([2, 2])
      doc.rect(ancho - 70, y, 50, 20)
      doc.setLineDash([])
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(0, 0, 0)
      doc.text('Sello', ancho - 45, y + 12, { align: 'center' })

      // Firma
      doc.setTextColor(0, 0, 0)
      doc.line(20, y + 15, 80, y + 15)
      doc.setFontSize(8)
      doc.text('Firma del receptor', 50, y + 20, { align: 'center' })
    }

    // Dibujar dos recibos
    dibujarReciboPago(10, '- CONSTANCIA -')
    dibujarReciboPago(140, '- COPIA CONTRIBUYENTE -')

    // Guardar PDF
    doc.save(`Recibo_${tipoPago.key}_${datosResponse.numeroRecibo}.pdf`)
  }

  // Calcular pendiente
  const calcularPendiente = () => {
    if (modoAbono) {
      const pagoExistente = pagos[tipoPagoSeleccionado?.key]
      const pendienteActual = pagoExistente ? parseFloat(pagoExistente.monto_pendiente) : 0
      const abono = parseFloat(formPago.monto_abono) || 0
      return Math.max(0, pendienteActual - abono).toFixed(2)
    } else {
      const total = parseFloat(formPago.monto_total) || 0
      const abono = parseFloat(formPago.monto_abono) || 0
      return Math.max(0, total - abono).toFixed(2)
    }
  }

  // =============== FUNCIONES DE COLEGIATURA ===============

  // Abrir modal de colegiatura
  const abrirModalColegiatura = () => {
    setFormColegiatura({ mes: '', monto_colegiatura: '', payment_method_id: '' })
    setModalColegiatura(true)
  }

  // Cerrar modal de colegiatura
  const cerrarModalColegiatura = () => {
    setModalColegiatura(false)
    setFormColegiatura({ mes: '', monto_colegiatura: '', payment_method_id: '' })
  }

  // Abrir modal de pago curso extra
  const abrirModalPagoCurso = () => {
    setFormPagoCurso({ month_id: '', amount: MONTO_CURSO_EXTRA.toString(), payment_method_id: '' })
    setModalPagoCurso(true)
  }

  // Cerrar modal de pago curso extra
  const cerrarModalPagoCurso = () => {
    setModalPagoCurso(false)
    setFormPagoCurso({ month_id: '', amount: '', payment_method_id: '' })
  }

  // Abrir modal de graduación
  const abrirModalGraduacion = () => {
    if (pagoGraduacion && parseFloat(pagoGraduacion.pending_amount) > 0) {
      setModoAbonoGraduacion(true)
      setFormGraduacion({
        total_amount: pagoGraduacion.total_amount,
        paid_amount: pagoGraduacion.pending_amount,
        payment_method_id: ''
      })
    } else if (pagoGraduacion && parseFloat(pagoGraduacion.pending_amount) === 0) {
      setModoAbonoGraduacion(false)
      setFormGraduacion({
        total_amount: pagoGraduacion.total_amount,
        paid_amount: pagoGraduacion.paid_amount,
        payment_method_id: ''
      })
    } else {
      setModoAbonoGraduacion(false)
      setFormGraduacion({ total_amount: '', paid_amount: '', payment_method_id: '' })
    }
    setModalGraduacion(true)
  }

  // Cerrar modal de graduación
  const cerrarModalGraduacion = () => {
    setModalGraduacion(false)
    setFormGraduacion({ total_amount: '', paid_amount: '', payment_method_id: '' })
    setModoAbonoGraduacion(false)
  }

  // Calcular pendiente de graduación
  const calcularPendienteGraduacion = () => {
    if (modoAbonoGraduacion) {
      const pendienteActual = pagoGraduacion ? parseFloat(pagoGraduacion.pending_amount) : 0
      const abono = parseFloat(formGraduacion.paid_amount) || 0
      return Math.max(0, pendienteActual - abono)
    } else {
      const total = parseFloat(formGraduacion.total_amount) || 0
      const abono = parseFloat(formGraduacion.paid_amount) || 0
      return Math.max(0, total - abono)
    }
  }

  // Generar recibo PDF para graduación
  const generarReciboGraduacionPDF = (datosResponse, estudiante) => {
    const doc = new jsPDF('p', 'mm', 'letter')
    const ancho = doc.internal.pageSize.getWidth()
    const fechaActual = new Date().toLocaleDateString('es-GT', { 
      day: '2-digit', month: 'long', year: 'numeric' 
    })

    const dibujarReciboGraduacion = (yOffset, titulo) => {
      // Marco del recibo
      doc.setDrawColor(0, 0, 0) // Negro
      doc.setLineWidth(0.5)
      doc.rect(10, yOffset, ancho - 20, 120)

      // Encabezado con borde
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(1)
      doc.rect(10, yOffset, ancho - 20, 25)

      // Título del centro educativo
      doc.setTextColor(0, 0, 0)
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
      doc.setDrawColor(0, 0, 0)
      doc.rect(15, y - 5, ancho - 30, 12)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`RECIBO No: ${datosResponse.numeroRecibo}`, 20, y + 2)
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
      doc.text(`Grado: ${estudiante.grado || 'N/A'}`, 20, y)
      doc.text(`Jornada: ${estudiante.jornada || 'N/A'}`, 100, y)
      y += 6
      doc.text(`Modalidad: ${estudiante.modalidad || 'N/A'}`, 20, y)
      doc.setFont('helvetica', 'bold')
      doc.text(`Forma de Pago: ${datosResponse.metodo_pago || 'N/A'}`, 100, y)
      doc.setFont('helvetica', 'normal')

      y += 12

      // Detalles del pago
      doc.setFont('helvetica', 'bold')
      doc.text('DETALLE DEL PAGO DE GRADUACIÓN:', 20, y)
      y += 8

      // Tabla de pago
      doc.setDrawColor(0, 0, 0)
      doc.line(20, y, ancho - 20, y)
      y += 6
      
      doc.setFont('helvetica', 'normal')
      doc.text('Concepto', 25, y)
      doc.text('Monto Total', 90, y)
      doc.text('Abono', 130, y)
      doc.text('Pendiente', 165, y)
      
      doc.line(20, y + 2, ancho - 20, y + 2)
      y += 8

      const pago = datosResponse.pago
      doc.text('Graduación', 25, y)
      doc.text(`Q${parseFloat(pago.total_amount).toFixed(2)}`, 90, y)
      doc.text(`Q${parseFloat(datosResponse.montoAbonado).toFixed(2)}`, 130, y)
      
      // Pendiente
      if (parseFloat(pago.pending_amount) === 0) {
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'bold')
        doc.text('CANCELADO', 165, y)
      } else {
        doc.setTextColor(0, 0, 0)
        doc.text(`Q${parseFloat(pago.pending_amount).toFixed(2)}`, 165, y)
      }

      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'normal')
      doc.line(20, y + 4, ancho - 20, y + 4)

      // Si es abono, mostrar historial
      if (datosResponse.esAbono) {
        y += 12
        doc.setDrawColor(0, 0, 0)
        doc.rect(20, y - 4, ancho - 40, 10)
        doc.setFont('helvetica', 'italic')
        doc.text(`Este recibo corresponde a un ABONO. Total abonado hasta la fecha: Q${parseFloat(pago.paid_amount).toFixed(2)}`, 25, y + 2)
      }

      // Espacio para sello
      y = yOffset + 95
      doc.setDrawColor(0, 0, 0)
      doc.setLineDash([2, 2])
      doc.rect(ancho - 70, y, 50, 20)
      doc.setLineDash([])
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(0, 0, 0)
      doc.text('Sello', ancho - 45, y + 12, { align: 'center' })

      // Firma
      doc.setTextColor(0, 0, 0)
      doc.line(20, y + 15, 80, y + 15)
      doc.setFontSize(8)
      doc.text('Firma del receptor', 50, y + 20, { align: 'center' })
    }

    // Dibujar dos recibos
    dibujarReciboGraduacion(10, '- CONSTANCIA PAGO GRADUACIÓN -')
    dibujarReciboGraduacion(140, '- COPIA CONTRIBUYENTE -')

    // Guardar PDF
    doc.save(`Recibo_Graduacion_${datosResponse.numeroRecibo}.pdf`)
  }

  // Guardar pago de graduación
  const handleGuardarGraduacion = async (e) => {
    e.preventDefault()
    
    const montoAbono = parseFloat(formGraduacion.paid_amount || 0)
    const montoTotal = parseFloat(formGraduacion.total_amount || 0)
    const pendienteActual = pagoGraduacion ? parseFloat(pagoGraduacion.pending_amount) : 0

    if (!formGraduacion.payment_method_id) {
      toast.error('Seleccione una forma de pago')
      return
    }

    if (!modoAbonoGraduacion) {
      if (!formGraduacion.total_amount || montoTotal <= 0) {
        toast.error('El monto total debe ser mayor a 0')
        return
      }
      if (montoAbono > montoTotal) {
        toast.error('El abono no puede ser mayor al monto total')
        return
      }
    } else {
      if (montoAbono <= 0) {
        toast.error('El monto a abonar debe ser mayor a 0')
        return
      }
      if (montoAbono > pendienteActual) {
        toast.error('El abono no puede ser mayor al pendiente')
        return
      }
    }

    setLoadingGraduacion(true)
    try {
      const response = await guardarPagoGraduacion(
        estudianteSeleccionado.id,
        {
          total_amount: formGraduacion.total_amount,
          paid_amount: formGraduacion.paid_amount,
          payment_method_id: parseInt(formGraduacion.payment_method_id)
        }
      )
      
      // Actualizar estado de pago
      setPagoGraduacion(response.data.pago)
      
      // Generar recibo PDF
      generarReciboGraduacionPDF(response.data, estudianteSeleccionado)
      
      if (response.data.estaCancelado) {
        toast.success('¡Pago de graduación completado!')
      } else {
        toast.success('Abono de graduación registrado correctamente')
      }
      
      cerrarModalGraduacion()
    } catch (error) {
      console.error(error)
      toast.error('Error al guardar el pago de graduación')
    } finally {
      setLoadingGraduacion(false)
    }
  }

  // Verificar si mes del curso está pagado
  const mesCursoPagado = (monthId) => {
    return historialPagosCurso.some(p => p.month_id === monthId)
  }

  // Obtener meses disponibles para pagar curso
  const mesesCursoDisponibles = () => {
    return mesesCursoExtra.filter(mes => !mesCursoPagado(mes.id))
  }

  // Calcular mora para curso (solo de febrero a octubre, si la fecha actual es posterior al día 5 del mes que se está pagando)
  const calcularMoraCurso = (mesId = null) => {
    const fechaActual = new Date()
    const mesActual = fechaActual.getMonth() + 1 // getMonth() devuelve 0-11
    const anioActual = fechaActual.getFullYear()
    
    // El mes_id corresponde al número del mes (1=Enero, 2=Febrero, etc.)
    const mesPagar = mesId ? parseInt(mesId) : 0
    
    // Solo aplicar mora de febrero (2) a octubre (10)
    if (mesPagar < 2 || mesPagar > 10) {
      return 0.00
    }
    
    // Crear fecha de vencimiento: día 5 del mes que se está pagando
    const fechaVencimiento = new Date(anioActual, mesPagar - 1, 5)
    
    // Solo aplicar mora si la fecha actual es posterior a la fecha de vencimiento
    if (fechaActual > fechaVencimiento) {
      return 30.00
    }
    
    return 0.00
  }

  // Calcular total con mora para curso
  const calcularTotalCurso = () => {
    const monto = parseFloat(formPagoCurso.amount) || 0
    const mora = calcularMoraCurso(formPagoCurso.mes_id)
    return (monto + mora).toFixed(2)
  }

  // Generar recibo PDF para curso
  const generarReciboCursoPDF = (datosPago, estudiante, numeroBoleto, metodoPago = 'N/A') => {
    const doc = new jsPDF('p', 'mm', 'letter')
    const ancho = doc.internal.pageSize.getWidth()
    const fechaActual = new Date().toLocaleDateString('es-GT', { 
      day: '2-digit', month: 'long', year: 'numeric' 
    })

    // Función para dibujar un recibo
    const dibujarRecibo = (yOffset, titulo) => {
      // Marco del recibo
      doc.setDrawColor(0, 0, 0) // Negro
      doc.setLineWidth(0.5)
      doc.rect(10, yOffset, ancho - 20, 120)

      // Encabezado con borde
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(1)
      doc.rect(10, yOffset, ancho - 20, 25)

      // Título del centro educativo
      doc.setTextColor(0, 0, 0)
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

      // Número de boleto y fecha
      doc.setDrawColor(0, 0, 0)
      doc.rect(15, y - 5, ancho - 30, 12)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`RECIBO No: ${numeroBoleto}`, 20, y + 2)
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
      doc.text(`Curso: ${estudianteSeleccionado?.extra_courses?.nombre || 'N/A'}`, 20, y)
      doc.text(`Jornada: ${estudiante.jornada || 'N/A'}`, 100, y)
      y += 6
      doc.text(`Modalidad: ${estudiante.modalidad || 'N/A'}`, 20, y)
      // Forma de pago
      doc.setFont('helvetica', 'bold')
      doc.text(`Forma de Pago: ${metodoPago}`, 100, y)
      doc.setFont('helvetica', 'normal')

      y += 12

      // Detalles del pago
      doc.setFont('helvetica', 'bold')
      doc.text('DETALLE DEL PAGO:', 20, y)
      y += 8

      // Tabla de pago
      doc.setDrawColor(0, 0, 0)
      doc.line(20, y, ancho - 20, y)
      y += 6
      
      doc.setFont('helvetica', 'normal')
      doc.text('Concepto', 25, y)
      doc.text('Mes', 90, y)
      doc.text('Monto', 130, y)
      doc.text('Mora', 155, y)
      doc.text('Total', 180, y)
      
      doc.line(20, y + 2, ancho - 20, y + 2)
      y += 8

      doc.text(`Curso Extra`, 25, y)
      doc.text(datosPago.month, 90, y)
      doc.text(`Q${parseFloat(datosPago.amount).toFixed(2)}`, 130, y)
      doc.text(`Q${parseFloat(datosPago.mora || 0).toFixed(2)}`, 155, y)
      doc.setFont('helvetica', 'bold')
      doc.text(`Q${parseFloat(datosPago.total_pagado).toFixed(2)}`, 180, y)

      doc.line(20, y + 4, ancho - 20, y + 4)

      // Espacio para sello
      y = yOffset + 95
      doc.setDrawColor(0, 0, 0)
      doc.setLineDash([2, 2])
      doc.rect(ancho - 70, y, 50, 20)
      doc.setLineDash([])
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(0, 0, 0)
      doc.text('Sello', ancho - 45, y + 12, { align: 'center' })

      // Firma
      doc.setTextColor(0, 0, 0)
      doc.line(20, y + 15, 80, y + 15)
      doc.setFontSize(8)
      doc.text('Firma del receptor', 50, y + 20, { align: 'center' })
    }

    // Dibujar dos recibos
    dibujarRecibo(10, '- CONSTANCIA -')
    dibujarRecibo(140, '- COPIA CONTRIBUYENTE -')

    // Guardar PDF
    doc.save(`Recibo_Curso_${numeroBoleto}.pdf`)
  }

  // Registrar pago de curso extra
  const handleRegistrarPagoCurso = async (e) => {
    e.preventDefault()

    if (!formPagoCurso.month_id) {
      toast.error('Seleccione un mes')
      return
    }

    if (!formPagoCurso.amount || parseFloat(formPagoCurso.amount) <= 0) {
      toast.error('Ingrese el monto del curso')
      return
    }

    if (!formPagoCurso.payment_method_id) {
      toast.error('Seleccione una forma de pago')
      return
    }

    setLoadingPagoCurso(true)
    try {
      const mora = calcularMoraCurso(formPagoCurso.month_id)
      const mesSeleccionado = mesesCursoExtra.find(m => m.id === parseInt(formPagoCurso.month_id))
      
      // Datos para el backend (usa nombres específicos)
      const pagoData = {
        estudiante_id: estudianteSeleccionado.id,
        mes_id: parseInt(formPagoCurso.month_id),
        monto: parseFloat(formPagoCurso.amount),
        mora: mora,
        payment_method_id: parseInt(formPagoCurso.payment_method_id)
      }
      
      const response = await registrarPagoCurso(pagoData)
      
      // Actualizar historial con datos del nuevo pago
      const nuevoPago = response.data?.data || response.data
      setHistorialPagosCurso(prev => [...prev, nuevoPago])
      
      // Generar recibo PDF
      const numeroBoleto = response.data?.numero_recibo || `CRS-${Date.now().toString().slice(-8)}`
      generarReciboCursoPDF(
        { 
          month: mesSeleccionado?.name || '', 
          amount: formPagoCurso.amount, 
          mora: mora,
          total_pagado: parseFloat(formPagoCurso.amount) + mora 
        },
        estudianteSeleccionado,
        numeroBoleto,
        response.data?.metodo_pago || 'N/A'
      )
      
      toast.success('Pago de curso registrado y recibo generado')
      cerrarModalPagoCurso()
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.error || 'Error al registrar pago del curso')
    } finally {
      setLoadingPagoCurso(false)
    }
  }

  // Calcular mora (solo de febrero a octubre, si la fecha actual es posterior al día 5 del mes que se está pagando)
  const calcularMora = (mesNombre = '') => {
    const fechaActual = new Date()
    const mesActual = fechaActual.getMonth() + 1 // getMonth() devuelve 0-11
    const anioActual = fechaActual.getFullYear()
    
    // Mapeo de nombres de mes a números
    const mesesMap = {
      'ENERO': 1, 'FEBRERO': 2, 'MARZO': 3, 'ABRIL': 4,
      'MAYO': 5, 'JUNIO': 6, 'JULIO': 7, 'AGOSTO': 8,
      'SEPTIEMBRE': 9, 'OCTUBRE': 10, 'NOVIEMBRE': 11, 'DICIEMBRE': 12
    }
    
    const mesPagar = mesesMap[mesNombre.toUpperCase()] || 0
    
    // Solo aplicar mora de febrero (2) a octubre (10)
    if (mesPagar < 2 || mesPagar > 10) {
      return 0.00
    }
    
    // Crear fecha de vencimiento: día 5 del mes que se está pagando
    const fechaVencimiento = new Date(anioActual, mesPagar - 1, 5)
    
    // Solo aplicar mora si la fecha actual es posterior a la fecha de vencimiento
    if (fechaActual > fechaVencimiento) {
      return 30.00
    }
    
    return 0.00
  }

  // Calcular total con mora
  const calcularTotalColegiatura = () => {
    const monto = parseFloat(formColegiatura.monto_colegiatura) || 0
    const mora = calcularMora(formColegiatura.mes)
    return (monto + mora).toFixed(2)
  }

  // Verificar si mes está pagado
  const mesPagado = (mes) => {
    return historialColegiaturas.some(p => p.mes === mes)
  }

  // Obtener meses disponibles para pagar
  const mesesDisponibles = () => {
    return MESES.filter(mes => !mesPagado(mes))
  }

  // Generar recibo PDF
  const generarReciboPDF = (datosPago, estudiante, numeroBoleto, metodoPago = 'N/A') => {
    const doc = new jsPDF('p', 'mm', 'letter')
    const ancho = doc.internal.pageSize.getWidth()
    const fechaActual = new Date().toLocaleDateString('es-GT', { 
      day: '2-digit', month: 'long', year: 'numeric' 
    })

    // Función para dibujar un recibo
    const dibujarRecibo = (yOffset, titulo) => {
      // Marco del recibo
      doc.setDrawColor(0, 0, 0) // Negro
      doc.setLineWidth(0.5)
      doc.rect(10, yOffset, ancho - 20, 120)

      // Encabezado con borde
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(1)
      doc.rect(10, yOffset, ancho - 20, 25)

      // Título del centro educativo
      doc.setTextColor(0, 0, 0)
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

      // Número de boleto y fecha
      doc.setDrawColor(0, 0, 0)
      doc.rect(15, y - 5, ancho - 30, 12)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`RECIBO No: ${numeroBoleto}`, 20, y + 2)
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
      doc.text(`Grado: ${estudiante.grado || 'N/A'}`, 20, y)
      doc.text(`Jornada: ${estudiante.jornada || 'N/A'}`, 100, y)
      y += 6
      doc.text(`Modalidad: ${estudiante.modalidad || 'N/A'}`, 20, y)
      // Forma de pago
      doc.setFont('helvetica', 'bold')
      doc.text(`Forma de Pago: ${metodoPago}`, 100, y)
      doc.setFont('helvetica', 'normal')

      y += 12

      // Detalles del pago
      doc.setFont('helvetica', 'bold')
      doc.text('DETALLE DEL PAGO:', 20, y)
      y += 8

      // Tabla de pago
      doc.setDrawColor(0, 0, 0)
      doc.line(20, y, ancho - 20, y)
      y += 6
      
      doc.setFont('helvetica', 'normal')
      doc.text('Concepto', 25, y)
      doc.text('Mes', 90, y)
      doc.text('Monto', 130, y)
      doc.text('Mora', 155, y)
      doc.text('Total', 180, y)
      
      doc.line(20, y + 2, ancho - 20, y + 2)
      y += 8

      doc.text('Colegiatura', 25, y)
      doc.text(datosPago.mes, 90, y)
      doc.text(`Q${parseFloat(datosPago.monto_colegiatura).toFixed(2)}`, 130, y)
      doc.text(`Q${parseFloat(datosPago.mora).toFixed(2)}`, 155, y)
      doc.setFont('helvetica', 'bold')
      doc.text(`Q${parseFloat(datosPago.total_pagado).toFixed(2)}`, 180, y)

      doc.line(20, y + 4, ancho - 20, y + 4)

      // Espacio para sello
      y = yOffset + 95
      doc.setDrawColor(0, 0, 0)
      doc.setLineDash([2, 2])
      doc.rect(ancho - 70, y, 50, 20)
      doc.setLineDash([])
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(0, 0, 0)
      doc.text('Sello', ancho - 45, y + 12, { align: 'center' })

      // Firma
      doc.setTextColor(0, 0, 0)
      doc.line(20, y + 15, 80, y + 15)
      doc.setFontSize(8)
      doc.text('Firma del receptor', 50, y + 20, { align: 'center' })
    }

    // Dibujar dos recibos
    dibujarRecibo(10, '- CONSTANCIA -')
    dibujarRecibo(140, '- COPIA CONTRIBUYENTE -')

    // Guardar PDF
    doc.save(`Recibo_Colegiatura_${numeroBoleto}.pdf`)
  }

  // Registrar pago de colegiatura
  const handleRegistrarColegiatura = async (e) => {
    e.preventDefault()

    if (!formColegiatura.mes) {
      toast.error('Seleccione un mes')
      return
    }

    if (!formColegiatura.monto_colegiatura || parseFloat(formColegiatura.monto_colegiatura) <= 0) {
      toast.error('Ingrese el monto de la colegiatura')
      return
    }

    if (!formColegiatura.payment_method_id) {
      toast.error('Seleccione una forma de pago')
      return
    }

    setLoadingColegiatura(true)
    try {
      const response = await registrarColegiatura(estudianteSeleccionado.id, {
        ...formColegiatura,
        payment_method_id: parseInt(formColegiatura.payment_method_id)
      })
      
      // Actualizar historial
      setHistorialColegiaturas(prev => [...prev, response.data.pago])
      
      // Generar recibo PDF
      generarReciboPDF(
        response.data.pago,
        response.data.estudiante,
        response.data.numeroBoleto,
        response.data.metodo_pago || 'N/A'
      )
      
      toast.success('Pago registrado y recibo generado')
      cerrarModalColegiatura()
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.error || 'Error al registrar pago')
    } finally {
      setLoadingColegiatura(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-6">
          <i className="bi bi-cash-stack text-green-600"></i>
          Módulo de Pagos
        </h1>

        {/* Buscador de estudiantes */}
        <div className="relative mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <i className="bi bi-search me-2"></i>
            Buscar Estudiante
          </label>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Escribe el nombre o apellido del estudiante..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {/* Resultados de búsqueda */}
          {(estudiantes.length > 0 || buscando) && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {buscando ? (
                <div className="p-4 text-center text-gray-500">
                  <i className="bi bi-arrow-repeat animate-spin me-2"></i>
                  Buscando...
                </div>
              ) : (
                estudiantes.map((est) => (
                  <div
                    key={est.id}
                    onClick={() => seleccionarEstudiante(est)}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 flex items-center justify-between"
                  >
                    <span className="font-medium">{est.nombre} {est.apellidos}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      est.tipo_estudiante === 'CURSO' 
                        ? 'bg-lime-100 text-lime-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {est.tipo_estudiante === 'CURSO' 
                        ? est.extra_courses?.nombre || 'Curso Extra' 
                        : est.grado}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Estudiante seleccionado */}
        {estudianteSeleccionado && (
          <div className={`border rounded-lg p-4 mb-6 ${
            estudianteSeleccionado.tipo_estudiante === 'CURSO'
              ? 'bg-lime-50 border-lime-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  estudianteSeleccionado.tipo_estudiante === 'CURSO'
                    ? 'bg-lime-600'
                    : 'bg-blue-600'
                }`}>
                  <i className="bi bi-person-fill text-white text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    {estudianteSeleccionado.nombre} {estudianteSeleccionado.apellidos}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {estudianteSeleccionado.tipo_estudiante === 'CURSO' ? (
                      <>
                        <i className="bi bi-journal-bookmark me-1"></i>
                        {estudianteSeleccionado.extra_courses?.nombre || 'Curso Extra'}
                      </>
                    ) : (
                      <>
                        <i className="bi bi-mortarboard me-1"></i>
                        {estudianteSeleccionado.grado}
                        {estudianteSeleccionado.extra_courses && (
                          <span className="ml-2 bg-lime-100 text-lime-700 text-xs px-2 py-0.5 rounded">
                            + {estudianteSeleccionado.extra_courses.nombre}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEstudianteSeleccionado(null)
                  setPagos({})
                  setHistorialColegiaturas([])
                  setHistorialPagosCurso([])
                  setMesesCursoExtra([])
                  setPagoGraduacion(null)
                  setAplicaGraduacion(false)
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <i className="bi bi-x-lg text-xl"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid de tipos de pago */}
      {estudianteSeleccionado && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {/* Primeros dos pagos: Inscripción y Uniforme */}
          {TIPOS_PAGO.slice(0, 2).map((tipo) => {
            const pagoInfo = pagos[tipo.key]
            const tienePago = pagoInfo !== null && pagoInfo !== undefined
            const estaCancelado = tienePago && parseFloat(pagoInfo.monto_pendiente) === 0
            
            return (
              <div
                key={tipo.key}
                onClick={() => abrirModal(tipo)}
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${
                  estaCancelado ? 'bg-green-50 border-green-400' : colorClasses[tipo.color]
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <i className={`bi ${tipo.icono} text-3xl ${estaCancelado ? 'text-green-600' : ''}`}></i>
                  <div>
                    <h3 className="font-bold">{tipo.nombre}</h3>
                    {estaCancelado && (
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                        ✓ CANCELADO
                      </span>
                    )}
                  </div>
                </div>
                
                {tienePago ? (
                  <div className="text-sm space-y-1">
                    <p>Total: <span className="font-bold">Q{pagoInfo.monto_total}</span></p>
                    <p>Abonado: <span className="font-bold text-green-700">Q{pagoInfo.monto_adelanto}</span></p>
                    {!estaCancelado && (
                      <p className="text-red-600 font-bold flex items-center gap-1">
                        <i className="bi bi-exclamation-triangle"></i>
                        Pendiente: Q{pagoInfo.monto_pendiente}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm opacity-75">
                    <i className="bi bi-plus-circle me-1"></i>
                    Sin registro de pago
                  </p>
                )}
              </div>
            )
          })}

          {/* TARJETA DE COLEGIATURA (tercera posición) */}
          <div
            onClick={abrirModalColegiatura}
            className={`p-5 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${colorClasses.yellow}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <i className="bi bi-calendar-check text-3xl"></i>
              <h3 className="font-bold">Pago Colegiatura</h3>
            </div>
            
            <div className="text-sm space-y-1">
              <p>Meses pagados: <span className="font-bold">{historialColegiaturas.length}/10</span></p>
              {historialColegiaturas.length > 0 && (
                <p className="text-green-700 font-medium">
                  <i className="bi bi-check-circle me-1"></i>
                  Último: {historialColegiaturas[historialColegiaturas.length - 1]?.mes}
                </p>
              )}
            </div>
          </div>

          {/* TARJETA DE PAGO CURSO EXTRA (solo si tiene curso extra) */}
          {estudianteSeleccionado?.curso_extra_id && (
            <div
              onClick={abrirModalPagoCurso}
              className="p-5 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 bg-lime-100 text-lime-700 hover:bg-lime-200 border-lime-400"
            >
              <div className="flex items-center gap-3 mb-3">
                <i className="bi bi-journal-bookmark text-3xl"></i>
                <h3 className="font-bold">Pago Curso {estudianteSeleccionado.extra_courses?.nombre || 'Extra'}</h3>
              </div>
              
              <div className="text-sm space-y-1">
                <p>Meses pagados: <span className="font-bold">{historialPagosCurso.length}/10</span></p>
                {historialPagosCurso.length > 0 && (
                  <p className="text-green-700 font-medium">
                    <i className="bi bi-check-circle me-1"></i>
                    Último: {historialPagosCurso[historialPagosCurso.length - 1]?.month}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TARJETA DE PAGO GRADUACIÓN (solo si aplica) */}
          {aplicaGraduacion && (
            <div
              onClick={abrirModalGraduacion}
              className={`p-5 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${
                pagoGraduacion && parseFloat(pagoGraduacion.pending_amount) === 0
                  ? 'bg-green-50 border-green-400'
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-400'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <i className={`bi bi-mortarboard-fill text-3xl ${pagoGraduacion && parseFloat(pagoGraduacion.pending_amount) === 0 ? 'text-green-600' : ''}`}></i>
                <div>
                  <h3 className="font-bold">Pago Graduación</h3>
                  {pagoGraduacion && parseFloat(pagoGraduacion.pending_amount) === 0 && (
                    <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                      ✓ CANCELADO
                    </span>
                  )}
                </div>
              </div>
              
              {pagoGraduacion ? (
                <div className="text-sm space-y-1">
                  <p>Total: <span className="font-bold">Q{parseFloat(pagoGraduacion.total_amount).toFixed(2)}</span></p>
                  <p>Abonado: <span className="font-bold text-green-700">Q{parseFloat(pagoGraduacion.paid_amount).toFixed(2)}</span></p>
                  {parseFloat(pagoGraduacion.pending_amount) > 0 && (
                    <p className="text-red-600 font-bold flex items-center gap-1">
                      <i className="bi bi-exclamation-triangle"></i>
                      Pendiente: Q{parseFloat(pagoGraduacion.pending_amount).toFixed(2)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm opacity-75">
                  <i className="bi bi-plus-circle me-1"></i>
                  Sin registro de pago
                </p>
              )}
            </div>
          )}

          {/* Resto de pagos normales */}
          {TIPOS_PAGO.slice(2).map((tipo) => {
            const pagoInfo = pagos[tipo.key]
            const tienePago = pagoInfo !== null && pagoInfo !== undefined
            const estaCancelado = tienePago && parseFloat(pagoInfo.monto_pendiente) === 0
            
            return (
              <div
                key={tipo.key}
                onClick={() => abrirModal(tipo)}
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${
                  estaCancelado ? 'bg-green-50 border-green-400' : colorClasses[tipo.color]
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <i className={`bi ${tipo.icono} text-3xl ${estaCancelado ? 'text-green-600' : ''}`}></i>
                  <div>
                    <h3 className="font-bold">{tipo.nombre}</h3>
                    {estaCancelado && (
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                        ✓ CANCELADO
                      </span>
                    )}
                  </div>
                </div>
                
                {tienePago ? (
                  <div className="text-sm space-y-1">
                    <p>Total: <span className="font-bold">Q{pagoInfo.monto_total}</span></p>
                    <p>Abonado: <span className="font-bold text-green-700">Q{pagoInfo.monto_adelanto}</span></p>
                    {!estaCancelado && (
                      <p className="text-red-600 font-bold flex items-center gap-1">
                        <i className="bi bi-exclamation-triangle"></i>
                        Pendiente: Q{pagoInfo.monto_pendiente}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm opacity-75">
                    <i className="bi bi-plus-circle me-1"></i>
                    Sin registro de pago
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Mensaje cuando no hay estudiante seleccionado */}
      {!estudianteSeleccionado && (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <i className="bi bi-search text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-xl font-medium text-gray-500">Busca un estudiante para gestionar sus pagos</h3>
          <p className="text-gray-400 mt-2">Escribe al menos 2 caracteres para iniciar la búsqueda</p>
        </div>
      )}

      {/* Modal de pago normal */}
      {modalAbierto && tipoPagoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className={`p-4 rounded-t-2xl ${colorClasses[tipoPagoSeleccionado.color]} border-b`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className={`bi ${tipoPagoSeleccionado.icono} text-2xl`}></i>
                  <h2 className="text-lg font-bold">{tipoPagoSeleccionado.nombre}</h2>
                </div>
                <button onClick={cerrarModal} className="hover:opacity-70">
                  <i className="bi bi-x-lg text-xl"></i>
                </button>
              </div>
            </div>

            <form onSubmit={handleGuardarPago} className="p-6 space-y-4">
              {/* Mostrar estado actual si hay pago existente */}
              {modoAbono && pagos[tipoPagoSeleccionado.key] && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
                  <h4 className="font-bold text-yellow-800 mb-2">
                    <i className="bi bi-info-circle me-2"></i>
                    Estado Actual del Pago
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Total</p>
                      <p className="font-bold">Q{pagos[tipoPagoSeleccionado.key].monto_total}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Abonado</p>
                      <p className="font-bold text-green-600">Q{pagos[tipoPagoSeleccionado.key].monto_adelanto}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Pendiente</p>
                      <p className="font-bold text-red-600">Q{pagos[tipoPagoSeleccionado.key].monto_pendiente}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Si ya está cancelado */}
              {pagos[tipoPagoSeleccionado.key] && parseFloat(pagos[tipoPagoSeleccionado.key].monto_pendiente) === 0 && (
                <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-center">
                  <i className="bi bi-check-circle-fill text-4xl text-green-500 mb-2"></i>
                  <h4 className="font-bold text-green-800">¡Este pago está completamente cancelado!</h4>
                  <p className="text-green-600 text-sm mt-1">
                    Total pagado: Q{pagos[tipoPagoSeleccionado.key].monto_total}
                  </p>
                </div>
              )}

              {/* Formulario solo si no está cancelado */}
              {(!pagos[tipoPagoSeleccionado.key] || parseFloat(pagos[tipoPagoSeleccionado.key].monto_pendiente) > 0) && (
                <>
                  {!modoAbono ? (
                    // Nuevo registro
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <i className="bi bi-currency-dollar me-1"></i>
                          Monto Total del Pago
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formPago.monto_total}
                          onChange={(e) => setFormPago(prev => ({ ...prev, monto_total: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ej: 500.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <i className="bi bi-wallet2 me-1"></i>
                          Monto a Abonar Ahora
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formPago.monto_abono}
                          onChange={(e) => setFormPago(prev => ({ ...prev, monto_abono: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Si no paga el total, quedará un pendiente que podrá abonar después
                        </p>
                      </div>
                    </>
                  ) : (
                    // Modo abono - pagar pendiente
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <i className="bi bi-cash-coin me-1"></i>
                        Monto a Abonar
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={pagos[tipoPagoSeleccionado.key]?.monto_pendiente}
                        value={formPago.monto_abono}
                        onChange={(e) => setFormPago(prev => ({ ...prev, monto_abono: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder={`Máximo: Q${pagos[tipoPagoSeleccionado.key]?.monto_pendiente}`}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setFormPago(prev => ({ ...prev, monto_abono: pagos[tipoPagoSeleccionado.key]?.monto_pendiente }))}
                          className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200"
                        >
                          Pagar todo el pendiente (Q{pagos[tipoPagoSeleccionado.key]?.monto_pendiente})
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Selector de forma de pago */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="bi bi-credit-card me-1"></i>
                      Forma de Pago
                    </label>
                    <select
                      value={formPago.payment_method_id}
                      onChange={(e) => setFormPago(prev => ({ ...prev, payment_method_id: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccione forma de pago</option>
                      {metodosPago.map(metodo => (
                        <option key={metodo.id} value={metodo.id}>{metodo.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">
                        <i className="bi bi-hourglass-split me-2"></i>
                        {modoAbono ? 'Pendiente después de este abono:' : 'Monto Pendiente:'}
                      </span>
                      <span className={`text-2xl font-bold ${parseFloat(calcularPendiente()) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {parseFloat(calcularPendiente()) === 0 ? '¡CANCELADO!' : `Q${calcularPendiente()}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={cerrarModal}
                      className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <i className="bi bi-arrow-repeat animate-spin"></i>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-receipt me-1"></i>
                          {modoAbono ? 'Registrar Abono' : 'Guardar y Generar Recibo'}
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* Botón cerrar si ya está cancelado */}
              {pagos[tipoPagoSeleccionado.key] && parseFloat(pagos[tipoPagoSeleccionado.key].monto_pendiente) === 0 && (
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cerrar
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Modal de Colegiatura */}
      {modalColegiatura && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className={`p-4 rounded-t-2xl ${colorClasses.yellow} border-b sticky top-0`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className="bi bi-calendar-check text-2xl"></i>
                  <h2 className="text-lg font-bold">Pago de Colegiatura</h2>
                </div>
                <button onClick={cerrarModalColegiatura} className="hover:opacity-70">
                  <i className="bi bi-x-lg text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Formulario de pago */}
              <form onSubmit={handleRegistrarColegiatura} className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="bi bi-calendar-month me-1"></i>
                      Mes a Pagar
                    </label>
                    <select
                      value={formColegiatura.mes}
                      onChange={(e) => setFormColegiatura(prev => ({ ...prev, mes: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="">Seleccione un mes</option>
                      {mesesDisponibles().map(mes => (
                        <option key={mes} value={mes}>{mes}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="bi bi-currency-dollar me-1"></i>
                      Monto Colegiatura
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formColegiatura.monto_colegiatura}
                      onChange={(e) => setFormColegiatura(prev => ({ ...prev, monto_colegiatura: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Resumen de pago */}
                {formColegiatura.monto_colegiatura && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-bold text-yellow-800 mb-3">
                      <i className="bi bi-receipt me-2"></i>
                      Resumen del Pago
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-600">Colegiatura</p>
                        <p className="font-bold text-lg">Q{parseFloat(formColegiatura.monto_colegiatura || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Mora {calcularMora(formColegiatura.mes) > 0 ? '(Aplica)' : '(No aplica)'}</p>
                        <p className={`font-bold text-lg ${calcularMora(formColegiatura.mes) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          Q{calcularMora(formColegiatura.mes).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-yellow-100 rounded-lg p-2">
                        <p className="text-sm text-gray-600">Total a Pagar</p>
                        <p className="font-bold text-xl text-yellow-800">Q{calcularTotalColegiatura()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selector de forma de pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="bi bi-credit-card me-1"></i>
                    Forma de Pago
                  </label>
                  <select
                    value={formColegiatura.payment_method_id}
                    onChange={(e) => setFormColegiatura(prev => ({ ...prev, payment_method_id: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="">Seleccione forma de pago</option>
                    {metodosPago.map(metodo => (
                      <option key={metodo.id} value={metodo.id}>{metodo.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={cerrarModalColegiatura}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loadingColegiatura || !formColegiatura.mes || !formColegiatura.monto_colegiatura || !formColegiatura.payment_method_id}
                    className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loadingColegiatura ? (
                      <>
                        <i className="bi bi-arrow-repeat animate-spin"></i>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg"></i>
                        Registrar y Generar Recibo
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Historial de solvencia */}
              <div className="border-t pt-6">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <i className="bi bi-clock-history"></i>
                  Historial de Solvencia {new Date().getFullYear()}
                </h4>

                <div className="grid grid-cols-5 gap-2 mb-4">
                  {MESES.map(mes => {
                    const pago = historialColegiaturas.find(p => p.mes === mes)
                    const pagado = !!pago
                    
                    return (
                      <div
                        key={mes}
                        className={`p-2 rounded-lg text-center text-xs font-medium ${
                          pagado 
                            ? 'bg-green-100 text-green-700 border border-green-300' 
                            : 'bg-red-50 text-red-600 border border-red-200'
                        }`}
                      >
                        <i className={`bi ${pagado ? 'bi-check-circle-fill' : 'bi-x-circle'} text-lg block mb-1`}></i>
                        {mes.slice(0, 3)}
                      </div>
                    )
                  })}
                </div>

                {/* Tabla de historial detallado */}
                {historialColegiaturas.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left">Mes</th>
                          <th className="px-3 py-2 text-right">Colegiatura</th>
                          <th className="px-3 py-2 text-right">Mora</th>
                          <th className="px-3 py-2 text-right">Total</th>
                          <th className="px-3 py-2 text-left">Fecha Pago</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historialColegiaturas.map((pago, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="px-3 py-2 font-medium">{pago.mes}</td>
                            <td className="px-3 py-2 text-right">Q{parseFloat(pago.monto_colegiatura).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right">
                              <span className={pago.mora > 0 ? 'text-red-600' : ''}>
                                Q{parseFloat(pago.mora).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right font-bold">Q{parseFloat(pago.total_pagado).toFixed(2)}</td>
                            <td className="px-3 py-2 text-gray-500">
                              {new Date(pago.fecha_pago).toLocaleDateString('es-GT')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {historialColegiaturas.length === 0 && (
                  <div className="text-center py-6 text-gray-400">
                    <i className="bi bi-inbox text-4xl block mb-2"></i>
                    No hay pagos de colegiatura registrados
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pago de Curso Extra */}
      {modalPagoCurso && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 rounded-t-2xl bg-lime-100 text-lime-700 border-b border-lime-300 sticky top-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className="bi bi-journal-bookmark text-2xl"></i>
                  <h2 className="text-lg font-bold">
                    Pago Curso {estudianteSeleccionado?.extra_courses?.nombre || ''}
                  </h2>
                </div>
                <button onClick={cerrarModalPagoCurso} className="hover:opacity-70">
                  <i className="bi bi-x-lg text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Formulario de pago */}
              <form onSubmit={handleRegistrarPagoCurso} className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="bi bi-calendar-month me-1"></i>
                      Mes a Pagar
                    </label>
                    <select
                      value={formPagoCurso.month_id}
                      onChange={(e) => setFormPagoCurso(prev => ({ ...prev, month_id: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500"
                    >
                      <option value="">Seleccione un mes</option>
                      {mesesCursoDisponibles().map(mes => (
                        <option key={mes.id} value={mes.id}>{mes.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="bi bi-currency-dollar me-1"></i>
                      Monto Curso
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formPagoCurso.amount}
                      onChange={(e) => setFormPagoCurso(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500"
                      placeholder="150.00"
                    />
                  </div>
                </div>

                {/* Resumen de pago */}
                {formPagoCurso.amount && (
                  <div className="bg-lime-50 border border-lime-200 rounded-lg p-4">
                    <h4 className="font-bold text-lime-800 mb-3">
                      <i className="bi bi-receipt me-2"></i>
                      Resumen del Pago
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-600">Mensualidad Curso</p>
                        <p className="font-bold text-lg">Q{parseFloat(formPagoCurso.amount || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Mora {new Date().getDate() > 5 ? '(Aplica)' : '(No aplica)'}</p>
                        <p className={`font-bold text-lg ${calcularMoraCurso() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          Q{calcularMoraCurso().toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-lime-100 rounded-lg p-2">
                        <p className="text-sm text-gray-600">Total a Pagar</p>
                        <p className="font-bold text-xl text-lime-800">Q{calcularTotalCurso()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selector de forma de pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="bi bi-credit-card me-1"></i>
                    Forma de Pago
                  </label>
                  <select
                    value={formPagoCurso.payment_method_id}
                    onChange={(e) => setFormPagoCurso(prev => ({ ...prev, payment_method_id: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500"
                  >
                    <option value="">Seleccione forma de pago</option>
                    {metodosPago.map(metodo => (
                      <option key={metodo.id} value={metodo.id}>{metodo.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={cerrarModalPagoCurso}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loadingPagoCurso || !formPagoCurso.month_id || !formPagoCurso.amount || !formPagoCurso.payment_method_id}
                    className="flex-1 px-4 py-3 bg-lime-600 text-white rounded-lg font-medium hover:bg-lime-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loadingPagoCurso ? (
                      <>
                        <i className="bi bi-arrow-repeat animate-spin"></i>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg"></i>
                        Registrar y Generar Recibo
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Historial de solvencia del curso */}
              <div className="border-t pt-6">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <i className="bi bi-clock-history"></i>
                  Historial de Pagos del Curso {new Date().getFullYear()}
                </h4>

                <div className="grid grid-cols-5 gap-2 mb-4">
                  {mesesCursoExtra.map(mes => {
                    const pago = historialPagosCurso.find(p => p.month_id === mes.id)
                    const pagado = !!pago
                    
                    return (
                      <div
                        key={mes.id}
                        className={`p-2 rounded-lg text-center text-xs font-medium ${
                          pagado 
                            ? 'bg-green-100 text-green-700 border border-green-300' 
                            : 'bg-red-50 text-red-600 border border-red-200'
                        }`}
                      >
                        <i className={`bi ${pagado ? 'bi-check-circle-fill' : 'bi-x-circle'} text-lg block mb-1`}></i>
                        {mes.name?.slice(0, 3) || ''}
                      </div>
                    )
                  })}
                </div>

                {/* Tabla de historial detallado */}
                {historialPagosCurso.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left">Mes</th>
                          <th className="px-3 py-2 text-right">Monto</th>
                          <th className="px-3 py-2 text-right">Mora</th>
                          <th className="px-3 py-2 text-right">Total</th>
                          <th className="px-3 py-2 text-left">Fecha Pago</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historialPagosCurso.map((pago, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="px-3 py-2 font-medium">{pago.month}</td>
                            <td className="px-3 py-2 text-right">Q{parseFloat(pago.amount).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right">
                              <span className={(pago.mora || 0) > 0 ? 'text-red-600' : ''}>
                                Q{parseFloat(pago.mora || 0).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right font-bold">
                              Q{(parseFloat(pago.amount) + parseFloat(pago.mora || 0)).toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-gray-500">
                              {new Date(pago.payment_date).toLocaleDateString('es-GT')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {historialPagosCurso.length === 0 && (
                  <div className="text-center py-6 text-gray-400">
                    <i className="bi bi-inbox text-4xl block mb-2"></i>
                    No hay pagos del curso registrados
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pago de Graduación */}
      {modalGraduacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-4 rounded-t-2xl bg-indigo-100 text-indigo-700 border-b border-indigo-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className="bi bi-mortarboard-fill text-2xl"></i>
                  <h2 className="text-lg font-bold">Pago de Graduación</h2>
                </div>
                <button onClick={cerrarModalGraduacion} className="hover:opacity-70">
                  <i className="bi bi-x-lg text-xl"></i>
                </button>
              </div>
            </div>

            <form onSubmit={handleGuardarGraduacion} className="p-6 space-y-4">
              {/* Mostrar estado actual si hay pago existente */}
              {modoAbonoGraduacion && pagoGraduacion && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
                  <h4 className="font-bold text-yellow-800 mb-2">
                    <i className="bi bi-info-circle me-2"></i>
                    Estado Actual del Pago
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Total</p>
                      <p className="font-bold">Q{parseFloat(pagoGraduacion.total_amount).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Abonado</p>
                      <p className="font-bold text-green-600">Q{parseFloat(pagoGraduacion.paid_amount).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Pendiente</p>
                      <p className="font-bold text-red-600">Q{parseFloat(pagoGraduacion.pending_amount).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Si ya está cancelado */}
              {pagoGraduacion && parseFloat(pagoGraduacion.pending_amount) === 0 && (
                <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-center">
                  <i className="bi bi-check-circle-fill text-4xl text-green-500 mb-2"></i>
                  <h4 className="font-bold text-green-800">¡Pago de graduación cancelado!</h4>
                  <p className="text-green-600 text-sm mt-1">
                    Total pagado: Q{parseFloat(pagoGraduacion.total_amount).toFixed(2)}
                  </p>
                </div>
              )}

              {/* Formulario solo si no está cancelado */}
              {(!pagoGraduacion || parseFloat(pagoGraduacion.pending_amount) > 0) && (
                <>
                  {!modoAbonoGraduacion ? (
                    // Nuevo registro
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <i className="bi bi-currency-dollar me-1"></i>
                          Monto Total de Graduación
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formGraduacion.total_amount}
                          onChange={(e) => setFormGraduacion(prev => ({ ...prev, total_amount: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="Ej: 1500.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <i className="bi bi-wallet2 me-1"></i>
                          Monto a Abonar Ahora
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formGraduacion.paid_amount}
                          onChange={(e) => setFormGraduacion(prev => ({ ...prev, paid_amount: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="0.00"
                        />
                      </div>
                    </>
                  ) : (
                    // Modo abono - pagar pendiente
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <i className="bi bi-cash-coin me-1"></i>
                        Monto a Abonar
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={pagoGraduacion?.pending_amount}
                        value={formGraduacion.paid_amount}
                        onChange={(e) => setFormGraduacion(prev => ({ ...prev, paid_amount: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder={`Máximo: Q${pagoGraduacion?.pending_amount}`}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setFormGraduacion(prev => ({ ...prev, paid_amount: pagoGraduacion?.pending_amount }))}
                          className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200"
                        >
                          Pagar todo el pendiente (Q{pagoGraduacion?.pending_amount})
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Selector de forma de pago */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="bi bi-credit-card me-1"></i>
                      Forma de Pago
                    </label>
                    <select
                      value={formGraduacion.payment_method_id}
                      onChange={(e) => setFormGraduacion(prev => ({ ...prev, payment_method_id: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Seleccione forma de pago</option>
                      {metodosPago.map(metodo => (
                        <option key={metodo.id} value={metodo.id}>{metodo.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">
                        <i className="bi bi-hourglass-split me-2"></i>
                        {modoAbonoGraduacion ? 'Pendiente después de este abono:' : 'Monto Pendiente:'}
                      </span>
                      <span className={`text-2xl font-bold ${calcularPendienteGraduacion() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {calcularPendienteGraduacion() === 0 ? '¡CANCELADO!' : `Q${calcularPendienteGraduacion().toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={cerrarModalGraduacion}
                      className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loadingGraduacion || !formGraduacion.payment_method_id}
                      className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loadingGraduacion ? (
                        <>
                          <i className="bi bi-arrow-repeat animate-spin"></i>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-receipt me-1"></i>
                          {modoAbonoGraduacion ? 'Registrar Abono' : 'Guardar y Generar Recibo'}
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* Botón cerrar si ya está cancelado */}
              {pagoGraduacion && parseFloat(pagoGraduacion.pending_amount) === 0 && (
                <button
                  type="button"
                  onClick={cerrarModalGraduacion}
                  className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cerrar
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Pagos

