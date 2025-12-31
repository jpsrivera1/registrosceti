import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
          <i className="bi bi-mortarboard-fill text-blue-600"></i>
          Sistema de Registro de Estudiantes
        </h1>
        <p className="text-gray-600 text-lg">
          Gestiona los registros de estudiantes de manera fácil y eficiente
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link
          to="/registrar"
          className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500"
        >
          <div className="text-4xl mb-4 text-green-500">
            <i className="bi bi-person-plus-fill"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Registrar Estudiante</h2>
          <p className="text-gray-600">
            Agrega un nuevo estudiante al sistema con toda su información
          </p>
        </Link>

        <Link
          to="/estudiantes"
          className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500"
        >
          <div className="text-4xl mb-4 text-blue-500">
            <i className="bi bi-people-fill"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ver Estudiantes</h2>
          <p className="text-gray-600">
            Consulta, edita o elimina los registros de estudiantes
          </p>
        </Link>
      </div>

      <div className="mt-12 bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i className="bi bi-bar-chart-fill text-purple-500"></i>
          Información del Sistema
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <i className="bi bi-bookmark-fill text-blue-500 text-2xl"></i>
            <p className="text-gray-600 text-sm mt-2">Grados Disponibles</p>
            <p className="text-2xl font-bold text-blue-600">13</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <i className="bi bi-clock-fill text-green-500 text-2xl"></i>
            <p className="text-gray-600 text-sm mt-2">Jornadas</p>
            <p className="text-2xl font-bold text-green-600">2</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <i className="bi bi-calendar-check-fill text-purple-500 text-2xl"></i>
            <p className="text-gray-600 text-sm mt-2">Modalidades</p>
            <p className="text-2xl font-bold text-purple-600">3</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
