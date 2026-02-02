import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerDocentes } from '../services/api';

export default function ListaDocentes() {
  const navigate = useNavigate();
  const [docentes, setDocentes] = useState([]);
  const [filteredDocentes, setFilteredDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroJornada, setFiltroJornada] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Activo');

  useEffect(() => {
    cargarDocentes();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [docentes, busqueda, filtroJornada, filtroEstado]);

  const cargarDocentes = async () => {
    setLoading(true);
    try {
      const response = await obtenerDocentes();
      if (response.ok) {
        setDocentes(response.docentes || []);
      }
    } catch (error) {
      console.error('Error al cargar docentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...docentes];

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      resultado = resultado.filter(docente =>
        docente.nombre.toLowerCase().includes(termino)
      );
    }

    // Filtro por jornada
    if (filtroJornada) {
      resultado = resultado.filter(docente => docente.jornada === filtroJornada);
    }

    // Filtro por estado
    if (filtroEstado) {
      resultado = resultado.filter(docente => docente.estado === filtroEstado);
    }

    setFilteredDocentes(resultado);
  };

  const getJornadaIcon = (jornada) => {
    return jornada === 'Matutina' 
      ? <i className="bi bi-sun-fill text-yellow-500"></i>
      : <i className="bi bi-moon-fill text-indigo-500"></i>;
  };

  const getEstadoBadge = (estado) => {
    if (estado === 'Activo') {
      return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Activo</span>;
    }
    return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">Inactivo</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <i className="bi bi-people-fill text-3xl text-blue-600"></i>
                <h1 className="text-3xl font-bold text-gray-800">Docentes</h1>
              </div>
              <p className="text-gray-600 ml-12">
                {filteredDocentes.length} {filteredDocentes.length === 1 ? 'docente' : 'docentes'}
              </p>
            </div>
            <button
              onClick={() => navigate('/docentes/registrar')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <i className="bi bi-person-plus-fill"></i>
              Registrar Docente
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="bi bi-search mr-2"></i>
                Buscar por nombre
              </label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar docente..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtro Jornada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="bi bi-clock mr-2"></i>
                Jornada
              </label>
              <select
                value={filtroJornada}
                onChange={(e) => setFiltroJornada(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas</option>
                <option value="Matutina">Matutina</option>
                <option value="Vespertina">Vespertina</option>
              </select>
            </div>

            {/* Filtro Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="bi bi-toggles mr-2"></i>
                Estado
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Docentes */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <i className="bi bi-arrow-repeat animate-spin text-4xl text-blue-600"></i>
              <p className="mt-4 text-gray-600">Cargando docentes...</p>
            </div>
          ) : filteredDocentes.length === 0 ? (
            <div className="p-12 text-center">
              <i className="bi bi-inbox text-6xl text-gray-300"></i>
              <p className="mt-4 text-gray-600 text-lg">No se encontraron docentes</p>
              <button
                onClick={() => navigate('/docentes/registrar')}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Registrar primer docente
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jornada
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UID Tarjeta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocentes.map((docente) => (
                    <tr key={docente.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <i className="bi bi-person-circle text-2xl text-gray-400 mr-3"></i>
                          <div className="text-sm font-medium text-gray-900">
                            {docente.nombre}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getJornadaIcon(docente.jornada)}
                          <span className="text-sm text-gray-900">{docente.jornada}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {docente.uid_tarjeta ? (
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-700">
                            {docente.uid_tarjeta}
                          </code>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(docente.estado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
