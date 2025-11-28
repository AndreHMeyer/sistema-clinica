import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MedicoAuthProvider, useMedicoAuth } from './contexts/MedicoAuthContext';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';

// Pages - Paciente
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Agendamento from './pages/Agendamento';
import MinhasConsultas from './pages/MinhasConsultas';
import Perfil from './pages/Perfil';

// Pages - Médico
import MedicoLogin from './pages/medico/MedicoLogin';
import MedicoDashboard from './pages/medico/MedicoDashboard';
import MedicoAgenda from './pages/medico/MedicoAgenda';
import MedicoHorarios from './pages/medico/MedicoHorarios';
import MedicoBloqueios from './pages/medico/MedicoBloqueios';
import MedicoConsultas from './pages/medico/MedicoConsultas';

// Pages - Admin
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMedicos from './pages/admin/AdminMedicos';
import AdminConvenios from './pages/admin/AdminConvenios';
import AdminRelatorios from './pages/admin/AdminRelatorios';
import AdminPacientes from './pages/admin/AdminPacientes';

// Layouts
import Layout from './components/Layout';
import MedicoLayout from './components/MedicoLayout';
import AdminLayout from './components/AdminLayout';

// Rota protegida
function PrivateRoute({ children }) {
  const { signed, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-clinic"></div>
      </div>
    );
  }

  return signed ? children : <Navigate to="/login" />;
}

// Rota pública (redireciona se logado)
function PublicRoute({ children }) {
  const { signed, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-clinic"></div>
      </div>
    );
  }

  return signed ? <Navigate to="/dashboard" /> : children;
}

// Rota protegida para médico
function MedicoPrivateRoute({ children }) {
  const { signed, loading } = useMedicoAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return signed ? children : <Navigate to="/medico/login" />;
}

// Rota pública para médico
function MedicoPublicRoute({ children }) {
  const { signed, loading } = useMedicoAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return signed ? <Navigate to="/medico/dashboard" /> : children;
}

// Rota protegida para admin
function AdminPrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/admin/login" />;
}

// Rota pública para admin
function AdminPublicRoute({ children }) {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/admin/dashboard" /> : children;
}

function App() {
  return (
    <AuthProvider>
      <MedicoAuthProvider>
        <AdminAuthProvider>
          <BrowserRouter>
            <Routes>
              {/* ========== ROTAS DO PACIENTE ========== */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/cadastro"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />

              {/* Rotas Protegidas do Paciente */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="agendar" element={<Agendamento />} />
                <Route path="consultas" element={<MinhasConsultas />} />
                <Route path="perfil" element={<Perfil />} />
              </Route>

              {/* ========== ROTAS DO MÉDICO ========== */}
              <Route
                path="/medico/login"
                element={
                  <MedicoPublicRoute>
                    <MedicoLogin />
                  </MedicoPublicRoute>
                }
              />

              {/* Rotas Protegidas do Médico */}
              <Route
                path="/medico"
                element={
                  <MedicoPrivateRoute>
                    <MedicoLayout />
                  </MedicoPrivateRoute>
                }
              >
                <Route index element={<Navigate to="/medico/dashboard" />} />
                <Route path="dashboard" element={<MedicoDashboard />} />
                <Route path="agenda" element={<MedicoAgenda />} />
                <Route path="consultas" element={<MedicoConsultas />} />
                <Route path="horarios" element={<MedicoHorarios />} />
                <Route path="bloqueios" element={<MedicoBloqueios />} />
              </Route>

              {/* ========== ROTAS DO ADMIN ========== */}
              <Route
                path="/admin/login"
                element={
                  <AdminPublicRoute>
                    <AdminLogin />
                  </AdminPublicRoute>
                }
              />

              {/* Rotas Protegidas do Admin */}
              <Route
                path="/admin"
                element={
                  <AdminPrivateRoute>
                    <AdminLayout />
                  </AdminPrivateRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="medicos" element={<AdminMedicos />} />
                <Route path="convenios" element={<AdminConvenios />} />
                <Route path="pacientes" element={<AdminPacientes />} />
                <Route path="relatorios" element={<AdminRelatorios />} />
              </Route>

              {/* Rota 404 */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </AdminAuthProvider>
      </MedicoAuthProvider>
    </AuthProvider>
  );
}

export default App;
