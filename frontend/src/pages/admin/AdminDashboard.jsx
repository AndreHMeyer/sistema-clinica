import { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import { 
  UserGroupIcon, 
  CalendarIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await adminApi.get('/dashboard');
      setDashboard(response.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total de Pacientes',
      value: dashboard?.totalPacientes || 0,
      icon: UserGroupIcon,
      color: 'bg-blue-500'
    },
    {
      title: 'Total de Médicos',
      value: dashboard?.totalMedicos || 0,
      icon: UserIcon,
      color: 'bg-green-500'
    },
    {
      title: 'Consultas Hoje',
      value: dashboard?.consultasHoje || 0,
      icon: ClockIcon,
      color: 'bg-orange-500'
    },
    {
      title: 'Consultas do Mês',
      value: dashboard?.consultasMes || 0,
      icon: CalendarIcon,
      color: 'bg-purple-500'
    },
    {
      title: 'Taxa de Cancelamento',
      value: `${dashboard?.taxaCancelamento || 0}%`,
      icon: ChartBarIcon,
      color: 'bg-red-500'
    },
    {
      title: 'Pacientes Bloqueados',
      value: dashboard?.pacientesBloqueados || 0,
      icon: ExclamationTriangleIcon,
      color: 'bg-yellow-500'
    }
  ];

  const statusLabels = {
    agendada: 'Agendadas',
    concluida: 'Concluídas',
    cancelada: 'Canceladas',
    remarcada: 'Remarcadas',
    nao_compareceu: 'Não compareceu'
  };

  const statusColors = {
    agendada: 'bg-blue-100 text-blue-800',
    concluida: 'bg-green-100 text-green-800',
    cancelada: 'bg-red-100 text-red-800',
    remarcada: 'bg-yellow-100 text-yellow-800',
    nao_compareceu: 'bg-gray-100 text-gray-800'
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Administrativo</h1>
        <p className="text-gray-600 mt-1">Visão geral do sistema</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{card.title}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status das consultas do mês */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Consultas por Status (Mês Atual)
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {dashboard?.consultasPorStatus?.map((item, index) => (
            <div 
              key={index}
              className={`${statusColors[item.status] || 'bg-gray-100 text-gray-800'} rounded-lg p-4 text-center`}
            >
              <p className="text-2xl font-bold">{item.total}</p>
              <p className="text-sm">{statusLabels[item.status] || item.status}</p>
            </div>
          ))}
        </div>

        {(!dashboard?.consultasPorStatus || dashboard.consultasPorStatus.length === 0) && (
          <p className="text-gray-500 text-center py-4">
            Nenhuma consulta registrada neste mês
          </p>
        )}
      </div>

      {/* Acesso rápido */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <a 
          href="/admin/medicos"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-2">👨‍⚕️ Gerenciar Médicos</h3>
          <p className="text-gray-500 text-sm">Cadastrar, editar ou desativar médicos</p>
        </a>

        <a 
          href="/admin/convenios"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-2">🏢 Gerenciar Convênios</h3>
          <p className="text-gray-500 text-sm">Administrar planos de saúde aceitos</p>
        </a>

        <a 
          href="/admin/relatorios"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-2">📊 Relatórios</h3>
          <p className="text-gray-500 text-sm">Gerar relatórios e exportar PDFs</p>
        </a>
      </div>
    </div>
  );
}
