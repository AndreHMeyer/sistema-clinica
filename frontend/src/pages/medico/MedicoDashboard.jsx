import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMedicoAuth } from '../../contexts/MedicoAuthContext';
import medicoApi from '../../services/medicoApi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MedicoDashboard() {
  const { medico } = useMedicoAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await medicoApi.get('/medico/dashboard');
      setDashboard(response.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data) => {
    if (!data) return '';
    try {
      const dataStr = data.toString().split('T')[0];
      return format(new Date(dataStr + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', data, error);
      return data;
    }
  };

  const formatarHora = (hora) => {
    if (!hora) return '';
    return hora.toString().substring(0, 5);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header de boas vindas */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Olá, Dr(a). {medico?.nome?.split(' ')[1] || medico?.nome?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          {medico?.especialidade_nome} • CRM: {medico?.crm}
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Consultas Hoje</p>
              <p className="text-3xl font-bold">{dashboard?.consultasHoje || 0}</p>
            </div>
            <span className="text-4xl opacity-80">📅</span>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Esta Semana</p>
              <p className="text-3xl font-bold">{dashboard?.consultasSemana || 0}</p>
            </div>
            <span className="text-4xl opacity-80">📊</span>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Realizadas (Mês)</p>
              <p className="text-3xl font-bold">{dashboard?.consultasRealizadasMes || 0}</p>
            </div>
            <span className="text-4xl opacity-80">✅</span>
          </div>
        </div>

        <Link to="/medico/agenda" className="card hover:shadow-lg transition-shadow cursor-pointer group bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Ver Agenda</p>
              <p className="text-lg font-bold">Completa →</p>
            </div>
            <span className="text-4xl opacity-80 group-hover:scale-110 transition-transform">📋</span>
          </div>
        </Link>
      </div>

      {/* Próxima consulta */}
      {dashboard?.proximaConsulta && (
        <div className="card mb-8 border-l-4 border-emerald-500">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🔔</span> Próxima Consulta
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{dashboard.proximaConsulta.paciente_nome}</h3>
                <p className="text-gray-500 text-sm">
                  {dashboard.proximaConsulta.tipo_atendimento === 'convenio' 
                    ? dashboard.proximaConsulta.convenio_nome 
                    : 'Particular'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-800">
                {formatarData(dashboard.proximaConsulta.data_consulta)}
              </p>
              <p className="text-lg font-bold text-emerald-600">
                {formatarHora(dashboard.proximaConsulta.hora_consulta)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/medico/agenda"
          className="card hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Ver Agenda</h3>
              <p className="text-sm text-gray-500">Consultas por data</p>
            </div>
          </div>
        </Link>

        <Link
          to="/medico/horarios"
          className="card hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <span className="text-2xl">⏰</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Meus Horários</h3>
              <p className="text-sm text-gray-500">Gerenciar disponibilidade</p>
            </div>
          </div>
        </Link>

        <Link
          to="/medico/bloqueios"
          className="card hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <span className="text-2xl">🚫</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Bloqueios</h3>
              <p className="text-sm text-gray-500">Bloquear horários</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
