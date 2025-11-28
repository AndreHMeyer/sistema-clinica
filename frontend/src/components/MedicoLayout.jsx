import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useMedicoAuth } from '../contexts/MedicoAuthContext';

export default function MedicoLayout() {
  const { medico, logout } = useMedicoAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/medico/login');
  };

  const menuItems = [
    { path: '/medico/dashboard', label: 'Início', icon: '🏠' },
    { path: '/medico/agenda', label: 'Minha Agenda', icon: '📅' },
    { path: '/medico/consultas', label: 'Consultas', icon: '📋' },
    { path: '/medico/horarios', label: 'Horários', icon: '⏰' },
    { path: '/medico/bloqueios', label: 'Bloqueios', icon: '🚫' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/medico/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">👨‍⚕️</span>
              <span className="text-xl font-bold text-white">Portal Médico</span>
            </Link>

            {/* User menu */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <span className="text-sm text-emerald-100">
                  {medico?.nome}
                </span>
                <span className="text-xs text-emerald-200 block">
                  {medico?.especialidade_nome}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-white bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 font-medium flex items-center gap-1"
              >
                <span>Sair</span>
                <span>🚪</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  location.pathname === item.path
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2025 Clínica Saúde+ - Portal do Médico
          </p>
        </div>
      </footer>
    </div>
  );
}
