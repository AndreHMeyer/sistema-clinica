import { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import { toast } from 'react-toastify';
import { format, subMonths } from 'date-fns';
import { 
  DocumentArrowDownIcon,
  ChartBarIcon,
  UserGroupIcon,
  CalendarIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function AdminRelatorios() {
  const [activeTab, setActiveTab] = useState('consultas');
  const [loading, setLoading] = useState(false);
  const [relatorio, setRelatorio] = useState(null);
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  
  const [filtros, setFiltros] = useState({
    dataInicio: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    dataFim: format(new Date(), 'yyyy-MM-dd'),
    medicoId: '',
    especialidadeId: '',
    status: '',
    limite: 20
  });

  useEffect(() => {
    loadListas();
  }, []);

  const loadListas = async () => {
    try {
      const [medicosRes, especialidadesRes] = await Promise.all([
        adminApi.get('/medicos'),
        adminApi.get('/especialidades')
      ]);
      setMedicos(medicosRes.data);
      setEspecialidades(especialidadesRes.data);
    } catch (error) {
      console.error('Erro ao carregar listas:', error);
    }
  };

  const gerarRelatorio = async (tipo) => {
    setLoading(true);
    try {
      let endpoint = '';
      const params = new URLSearchParams({
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim
      });

      switch (tipo) {
        case 'consultas':
          endpoint = '/relatorios/consultas';
          if (filtros.medicoId) params.append('medicoId', filtros.medicoId);
          if (filtros.especialidadeId) params.append('especialidadeId', filtros.especialidadeId);
          if (filtros.status) params.append('status', filtros.status);
          break;
        case 'medicos':
          endpoint = '/relatorios/medicos';
          break;
        case 'especialidades':
          endpoint = '/relatorios/especialidades';
          break;
        case 'pacientes':
          endpoint = '/relatorios/pacientes-frequentes';
          params.append('limite', filtros.limite);
          break;
        case 'cancelamentos':
          endpoint = '/relatorios/cancelamentos';
          break;
      }

      const response = await adminApi.get(`${endpoint}?${params}`);
      setRelatorio({ tipo, data: response.data });
    } catch (error) {
      toast.error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (tipo) => {
    try {
      const params = new URLSearchParams({
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim
      });

      if (tipo === 'consultas') {
        if (filtros.medicoId) params.append('medicoId', filtros.medicoId);
        if (filtros.especialidadeId) params.append('especialidadeId', filtros.especialidadeId);
        if (filtros.status) params.append('status', filtros.status);
      }

      if (tipo === 'pacientes') {
        params.append('limite', filtros.limite);
      }

      const response = await adminApi.get(`/relatorios/pdf/${tipo}?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-${tipo}-${filtros.dataInicio}-${filtros.dataFim}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
    }
  };

  const tabs = [
    { id: 'consultas', name: 'Consultas', icon: CalendarIcon },
    { id: 'medicos', name: 'Por Médico', icon: UserGroupIcon },
    { id: 'especialidades', name: 'Por Especialidade', icon: ChartBarIcon },
    { id: 'pacientes', name: 'Pacientes Frequentes', icon: UserGroupIcon },
    { id: 'cancelamentos', name: 'Cancelamentos', icon: XCircleIcon }
  ];

  const statusLabels = {
    agendada: 'Agendada',
    concluida: 'Concluída',
    cancelada: 'Cancelada',
    remarcada: 'Remarcada',
    nao_compareceu: 'Não compareceu'
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Relatórios</h1>
        <p className="text-gray-600 mt-1">Gere relatórios e exporte em PDF</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md mb-6">
        <div className="flex border-b overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setRelatorio(null);
              }}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Data Início</label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Data Fim</label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {activeTab === 'consultas' && (
              <>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Médico</label>
                  <select
                    value={filtros.medicoId}
                    onChange={(e) => setFiltros({ ...filtros, medicoId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Todos</option>
                    {medicos.map(m => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Status</label>
                  <select
                    value={filtros.status}
                    onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Todos</option>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {activeTab === 'pacientes' && (
              <div>
                <label className="block text-gray-700 font-medium mb-1">Limite</label>
                <select
                  value={filtros.limite}
                  onChange={(e) => setFiltros({ ...filtros, limite: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="10">Top 10</option>
                  <option value="20">Top 20</option>
                  <option value="50">Top 50</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => gerarRelatorio(activeTab)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <ChartBarIcon className="w-5 h-5" />
              {loading ? 'Gerando...' : 'Gerar Relatório'}
            </button>

            <button
              onClick={() => downloadPDF(activeTab)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {relatorio && (
        <div className="bg-white rounded-xl shadow-md p-6">
          {/* Relatório de Consultas */}
          {relatorio.tipo === 'consultas' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Relatório de Consultas
                </h2>
                <p className="text-gray-500">
                  {format(new Date(filtros.dataInicio), 'dd/MM/yyyy')} - {format(new Date(filtros.dataFim), 'dd/MM/yyyy')}
                </p>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{relatorio.data.estatisticas?.total || 0}</p>
                  <p className="text-sm text-blue-600">Total</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{relatorio.data.estatisticas?.concluidas || 0}</p>
                  <p className="text-sm text-green-600">Concluídas</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{relatorio.data.estatisticas?.canceladas || 0}</p>
                  <p className="text-sm text-red-600">Canceladas</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{relatorio.data.estatisticas?.remarcadas || 0}</p>
                  <p className="text-sm text-yellow-600">Remarcadas</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-600">{relatorio.data.estatisticas?.nao_compareceram || 0}</p>
                  <p className="text-sm text-gray-600">Faltas</p>
                </div>
              </div>

              {/* Tabela */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Data</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Hora</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Paciente</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Médico</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Especialidade</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {relatorio.data.consultas?.slice(0, 50).map((consulta, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">
                          {format(new Date(consulta.data_consulta), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {consulta.hora_consulta?.substring(0, 5)}
                        </td>
                        <td className="px-4 py-3 text-gray-800">{consulta.paciente_nome}</td>
                        <td className="px-4 py-3 text-gray-600">{consulta.medico_nome}</td>
                        <td className="px-4 py-3 text-gray-600">{consulta.especialidade}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            consulta.status === 'concluida' ? 'bg-green-100 text-green-800' :
                            consulta.status === 'cancelada' ? 'bg-red-100 text-red-800' :
                            consulta.status === 'agendada' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {statusLabels[consulta.status] || consulta.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Relatório de Médicos */}
          {relatorio.tipo === 'medicos' && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Relatório por Médico</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Médico</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">CRM</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Especialidade</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Total</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Concluídas</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Canceladas</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Taxa Cancel.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {relatorio.data.relatorio?.map((med, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{med.nome}</td>
                        <td className="px-4 py-3 text-gray-600">{med.crm}</td>
                        <td className="px-4 py-3 text-gray-600">{med.especialidade}</td>
                        <td className="px-4 py-3 text-center font-medium">{med.total_consultas}</td>
                        <td className="px-4 py-3 text-center text-green-600">{med.concluidas}</td>
                        <td className="px-4 py-3 text-center text-red-600">{med.canceladas}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            (med.taxa_cancelamento || 0) > 30 ? 'bg-red-100 text-red-800' :
                            (med.taxa_cancelamento || 0) > 15 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {med.taxa_cancelamento || 0}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Relatório de Especialidades */}
          {relatorio.tipo === 'especialidades' && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Relatório por Especialidade</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Especialidade</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Médicos</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Total Consultas</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Concluídas</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Canceladas</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Taxa Cancel.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {relatorio.data.relatorio?.map((esp, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{esp.especialidade}</td>
                        <td className="px-4 py-3 text-center">{esp.total_medicos}</td>
                        <td className="px-4 py-3 text-center font-medium">{esp.total_consultas}</td>
                        <td className="px-4 py-3 text-center text-green-600">{esp.concluidas}</td>
                        <td className="px-4 py-3 text-center text-red-600">{esp.canceladas}</td>
                        <td className="px-4 py-3 text-center">{esp.taxa_cancelamento || 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Relatório de Pacientes Frequentes */}
          {relatorio.tipo === 'pacientes' && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Pacientes Mais Frequentes</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">#</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Paciente</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Convênio</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Consultas</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Compareceu</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Faltou</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Cancelou</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {relatorio.data.relatorio?.map((pac, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{index + 1}º</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{pac.nome}</p>
                          <p className="text-sm text-gray-500">{pac.email}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{pac.convenio || 'Particular'}</td>
                        <td className="px-4 py-3 text-center font-bold text-purple-600">{pac.total_consultas}</td>
                        <td className="px-4 py-3 text-center text-green-600">{pac.compareceu}</td>
                        <td className="px-4 py-3 text-center text-red-600">{pac.faltou}</td>
                        <td className="px-4 py-3 text-center text-yellow-600">{pac.cancelou}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Relatório de Cancelamentos */}
          {relatorio.tipo === 'cancelamentos' && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Análise de Cancelamentos</h2>
              
              {/* Taxa Geral */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{relatorio.data.taxaGeral?.total || 0}</p>
                  <p className="text-sm text-blue-600">Total de Consultas</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">{relatorio.data.taxaGeral?.canceladas || 0}</p>
                  <p className="text-sm text-red-600">Canceladas</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-600">{relatorio.data.taxaGeral?.remarcadas || 0}</p>
                  <p className="text-sm text-yellow-600">Remarcadas</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">{relatorio.data.taxaGeral?.taxa_cancelamento || 0}%</p>
                  <p className="text-sm text-purple-600">Taxa de Cancelamento</p>
                </div>
              </div>

              {/* Por dia da semana */}
              <h3 className="text-lg font-bold text-gray-800 mb-4">Por Dia da Semana</h3>
              <div className="grid grid-cols-7 gap-2 mb-8">
                {relatorio.data.porDiaSemana?.map((dia, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium text-gray-600">{dia.dia_nome?.substring(0, 3)}</p>
                    <p className="text-lg font-bold text-gray-800">{dia.total}</p>
                    <p className="text-xs text-red-500">{dia.taxa || 0}% canc.</p>
                  </div>
                ))}
              </div>

              {/* Por mês */}
              <h3 className="text-lg font-bold text-gray-800 mb-4">Por Mês</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Mês</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Total</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Canceladas</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Taxa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {relatorio.data.porMes?.map((mes, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{mes.mes}</td>
                        <td className="px-4 py-3 text-center">{mes.total}</td>
                        <td className="px-4 py-3 text-center text-red-600">{mes.canceladas}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            (mes.taxa || 0) > 30 ? 'bg-red-100 text-red-800' :
                            (mes.taxa || 0) > 15 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {mes.taxa || 0}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
