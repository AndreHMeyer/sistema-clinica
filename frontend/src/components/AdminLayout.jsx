import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { 
  HomeIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
  ArrowRightOnRectangleIcon,
  BuildingOfficeIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: HomeIcon },
    { name: 'Médicos', path: '/admin/medicos', icon: UserGroupIcon },
    { name: 'Pacientes', path: '/admin/pacientes', icon: UsersIcon },
    { name: 'Convênios', path: '/admin/convenios', icon: BuildingOfficeIcon },
    { name: 'Relatórios', path: '/admin/relatorios', icon: DocumentChartBarIcon },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-purple-800 text-white">
        <div className="p-4 border-b border-purple-700">
          <h1 className="text-xl font-bold">🏥 Clínica Saúde+</h1>
          <p className="text-purple-300 text-sm">Área Administrativa</p>
        </div>
        
        <nav className="mt-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                isActive(item.path)
                  ? 'bg-purple-900 border-r-4 border-purple-300'
                  : 'hover:bg-purple-700'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-purple-700">
          <div className="mb-3">
            <p className="text-sm font-medium">{admin?.nome}</p>
            <p className="text-purple-300 text-xs">{admin?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
