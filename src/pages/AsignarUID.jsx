import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { obtenerEstudiantes, asignarUID, obtenerUltimoUID, obtenerDocentes, asignarUIDDocente } from '../services/api'

function AsignarUID() {
  const [tipo, setTipo] = useState('estudiante') // 'estudiante' o 'docente'
  const [estudiantes, setEstudiantes] = useState([])
  const [docentes, setDocentes] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [uid, setUid] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [escuchandoNFC, setEscuchandoNFC] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [tipo])

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const items = tipo === 'estudiante' ? estudiantes : docentes
      const filtered = items.filter(item => {
        if (tipo === 'estudiante') {
          return `${item.nombre} ${item.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.grado?.toLowerCase().includes(searchTerm.toLowerCase())
        } else {
          return item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.jornada?.toLowerCase().includes(searchTerm.toLowerCase())
        }
      })
      setFilteredItems(filtered)
    } else {
      setFilteredItems([])
    }
  }, [searchTerm, estudiantes, docentes, tipo])

  // Polling para detectar UIDs del lector NFC
  useEffect(() => {
    if (!selectedItem || !escuchandoNFC) return

    const interval = setInterval(async () => {
      try {
        const response = await obtenerUltimoUID()
        if (response.data.detectado && response.data.uid) {
          setUid(response.data.uid)
          toast.success('✅ UID detectado automáticamente desde el lector NFC')
        }
      } catch (err) {
        console.error('Error al obtener UID:', err)
      }
    }, 1000) // Cada 1 segundo

    return () => clearInterval(interval)
  }, [selectedItem, escuchandoNFC])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      if (tipo === 'estudiante') {
        const response = await obtenerEstudiantes()
        setEstudiantes(response.data.data || [])
      } else {
        const response = await obtenerDocentes()
        setDocentes(response.docentes || [])
      }
    } catch (error) {
      console.error(error)
      toast.error(`Error al cargar ${tipo === 'estudiante' ? 'estudiantes' : 'docentes'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectItem = (item) => {
    setSelectedItem(item)
    setUid(item.uid_tarjeta || '')
    setSearchTerm('')
    setFilteredItems([])
    setEscuchandoNFC(true) // Activar escucha automática
    toast.info('📡 Escuchando lector NFC... Acerca la tarjeta')
  }

  const handleAsignarUID = async (e) => {
    e.preventDefault()
    
    if (!uid.trim()) {
      toast.error('Ingresa el UID de la tarjeta')
      return
    }

    setSaving(true)
    try {
      if (tipo === 'estudiante') {
        await asignarUID(selectedItem.id, uid.trim())
        // Actualizar en el estado local
        setEstudiantes(prev =>
          prev.map(est =>
            est.id === selectedItem.id
              ? { ...est, uid_tarjeta: uid.trim().toUpperCase() }
              : est
          )
        )
      } else {
        await asignarUIDDocente(selectedItem.id, uid.trim())
        // Actualizar en el estado local
        setDocentes(prev =>
          prev.map(doc =>
            doc.id === selectedItem.id
              ? { ...doc, uid_tarjeta: uid.trim().toUpperCase() }
              : doc
          )
        )
      }
      
      toast.success('UID asignado correctamente')
      setSelectedItem(null)
      setUid('')
      setEscuchandoNFC(false)
    } catch (error) {
      console.error(error)
      const errorMsg = error.response?.data?.error || error.response?.data?.mensaje || error.mensaje || 'Error al asignar UID'
      toast.error(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600 flex items-center gap-2">
          <i className="bi bi-arrow-repeat animate-spin"></i>
          Cargando...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <i className="bi bi-credit-card text-4xl text-blue-500"></i>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Asignar Tarjeta NFC</h1>
            <p className="text-gray-600">Vincula tarjetas NFC a estudiantes o docentes</p>
          </div>
        </div>

        {/* Selector de Tipo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Usuario
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setTipo('estudiante')
                setSelectedItem(null)
                setUid('')
                setSearchTerm('')
                setEscuchandoNFC(false)
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                tipo === 'estudiante'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className="bi bi-person-fill mr-2"></i>
              Estudiante
            </button>
            <button
              onClick={() => {
                setTipo('docente')
                setSelectedItem(null)
                setUid('')
                setSearchTerm('')
                setEscuchandoNFC(false)
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                tipo === 'docente'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className="bi bi-person-badge mr-2"></i>
              Docente
            </button>
          </div>
        </div>

        {/* Buscador */}
        {!selectedItem && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="bi bi-search me-2"></i>
              Buscar {tipo === 'estudiante' ? 'Estudiante' : 'Docente'}
            </label>
            <input
              type="text"
              placeholder={tipo === 'estudiante' ? 'Escribe nombre o grado...' : 'Escribe nombre o jornada...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {/* Resultados */}
            {filteredItems.length > 0 && (
              <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className="p-4 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {tipo === 'estudiante' ? `${item.nombre} ${item.apellidos}` : item.nombre}
                        </p>
                        <p className="text-sm text-gray-600">
                          {tipo === 'estudiante' 
                            ? `${item.grado} - ${item.jornada} - ${item.modalidad}`
                            : `Jornada: ${item.jornada}`
                          }
                        </p>
                      </div>
                      {item.uid_tarjeta && (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                          <i className="bi bi-check-circle me-1"></i>
                          Tiene tarjeta
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Formulario de asignación */}
        {selectedItem && (
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <i className={`${tipo === 'estudiante' ? 'bi-person-fill' : 'bi-person-badge'} text-white text-xl`}></i>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    {tipo === 'estudiante' 
                      ? `${selectedItem.nombre} ${selectedItem.apellidos}`
                      : selectedItem.nombre
                    }
                  </h3>
                  <p className="text-sm text-gray-600">
                    {tipo === 'estudiante'
                      ? `${selectedItem.grado} - ${selectedItem.jornada}`
                      : `Jornada: ${selectedItem.jornada}`
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedItem(null)
                  setUid('')
                  setEscuchandoNFC(false)
                }}
                className="text-gray-400 hover:text-red-500"
              >
                <i className="bi bi-x-lg text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleAsignarUID} className="space-y-4">
              {/* Indicador de escucha NFC */}
              {escuchandoNFC && (
                <div className="bg-white border-2 border-blue-400 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <i className="bi bi-broadcast text-blue-600 text-2xl"></i>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-800">📡 Escuchando lector NFC...</p>
                      <p className="text-sm text-blue-600">Acerca la tarjeta al lector. El UID aparecerá automáticamente.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEscuchandoNFC(false)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Detener escucha"
                    >
                      <i className="bi bi-pause-circle text-xl"></i>
                    </button>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="bi bi-credit-card-2-front me-2"></i>
                  UID de la Tarjeta NFC
                </label>
                <input
                  type="text"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="Ejemplo: 04A1B2C3D4AA80"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                />
                <p className="mt-2 text-sm text-gray-500">
                  <i className="bi bi-info-circle me-1"></i>
                  {escuchandoNFC ? 'Esperando detección automática del lector NFC...' : 'Pega el UID manualmente o activa la escucha NFC'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <i className="bi bi-arrow-repeat animate-spin"></i>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle"></i>
                      Asignar Tarjeta
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItem(null)
                    setUid('')
                    setEscuchandoNFC(false)
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de usuarios con tarjeta */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i className="bi bi-list-check"></i>
            {tipo === 'estudiante' ? 'Estudiantes' : 'Docentes'} con Tarjeta Asignada
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(tipo === 'estudiante' ? estudiantes : docentes)
              .filter(item => item.uid_tarjeta)
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 p-4 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {tipo === 'estudiante' ? `${item.nombre} ${item.apellidos}` : item.nombre}
                    </p>
                    <p className="text-sm text-gray-600">
                      {tipo === 'estudiante' 
                        ? `${item.grado} - ${item.jornada}`
                        : `Jornada: ${item.jornada}`
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">UID</p>
                    <p className="font-mono text-sm font-semibold text-blue-600">
                      {item.uid_tarjeta}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AsignarUID
