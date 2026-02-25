import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrarDocente } from '../services/api';

export default function RegistrarDocente() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    jornada: 'Matutina'
  });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });

    // Validaciones
    if (!formData.nombre.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre es obligatorio' });
      return;
    }

    setLoading(true);

    try {
      const response = await registrarDocente(formData);
      
      if (response.ok) {
        setMensaje({ tipo: 'success', texto: '✅ Docente registrado exitosamente' });
        // Limpiar formulario
        setFormData({
          nombre: '',
          jornada: 'Matutina'
        });
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          navigate('/docentes');
        }, 2000);
      } else {
        setMensaje({ tipo: 'error', texto: response.mensaje || 'Error al registrar docente' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMensaje({ tipo: 'error', texto: 'Error de conexión con el servidor' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <i className="bi bi-person-badge text-3xl text-blue-600"></i>
            <h1 className="text-3xl font-bold text-gray-800">Registrar Docente</h1>
          </div>
          <p className="text-gray-600 ml-12">Agrega un nuevo docente al sistema</p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre Completo */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                <i className="bi bi-person-fill text-blue-600 mr-2"></i>
                Nombre Completo *
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Juan Carlos Pérez García"
                required
              />
            </div>

            {/* Jornada */}
            <div>
              <label htmlFor="jornada" className="block text-sm font-medium text-gray-700 mb-2">
                <i className="bi bi-clock-fill text-blue-600 mr-2"></i>
                Jornada *
              </label>
              <select
                id="jornada"
                name="jornada"
                value={formData.jornada}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="Matutina">Matutina</option>
                <option value="Vespertina">Vespertina</option>
                <option value="Fin de semana">Fin de semana</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Selecciona la jornada en la que trabaja el docente
              </p>
            </div>

            {/* Mensaje de estado */}
            {mensaje.texto && (
              <div className={`p-4 rounded-lg ${
                mensaje.tipo === 'success' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                <p className="font-medium">{mensaje.texto}</p>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="bi bi-arrow-repeat animate-spin"></i>
                    Registrando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="bi bi-check-circle"></i>
                    Registrar Docente
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/docentes')}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                <span className="flex items-center justify-center gap-2">
                  <i className="bi bi-arrow-left"></i>
                  Cancelar
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <i className="bi bi-info-circle"></i>
            Información
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Después de registrar al docente, podrás asignarle una tarjeta NFC</li>
            <li>• La tarjeta se usa para registrar asistencia automáticamente</li>
            <li>• Puedes editar la información del docente en cualquier momento</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
