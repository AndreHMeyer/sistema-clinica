import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import medicoApi from '../../services/medicoApi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MedicoConsultas() {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    loadConsultas();
  }, [filtroStatus, dataInicio, dataFim]);

  const loadConsultas = async () => {
    setLoading(true);
    try {
      let url = '/medico/consultas?';
      if (filtroStatus) url += `status=${filtroStatus}&`;
      if (dataInicio) url += `data_inicio=${dataInicio}&`;
      if (dataFim) url += `data_fim=${dataFim}&`;

      const response = await medicoApi.get(url);
      setConsultas(response.data);
    } catch (error) {
      toast.error('Erro ao carregar consultas');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data) => {
    return format(new Date(data + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR });
  };

  const formatarHora = (hora) => hora.substring(0, 5);

  const getStatusBadge = (status) => {
    const badges = {
      agendada: { class: 'bg-blue-100 text-blue-700', label: 'Agendada' },
      remarcada: { class: 'bg-yellow-100 text-yellow-700', label: 'Remarcada' },
      realizada: { class: 'bg-green-100 text-green-700', label: 'Realizada' },
      cancelada: { class: 'bg-red-100 text-red-700', label: 'Cancelada' },
      falta: { class: 'bg-gray-100 text-gray-700', label: 'Falta' }
    };
    const badge = badges[status];
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.class}`}>{badge.label}</span>;
  };

  const limparFiltros = () => {
    setFiltroStatus('');
    setDataInicio('');
    setDataFim('');
  };

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">📋 Todas as Consultas</h1>
      <p className="text-gray-600 mb-6">Histórico completo de consultas</p>

      {/* Filtros */}
      <div className="card mb-6">
        <h3 className="font-medium text-gray-700 mb-4">🔍 Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Status</label>
            <select
              className="form-input"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="agendada">Agendada</option>
              <option value="remarcada">Remarcada</option>
              <option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option>
              <option value="falta">Falta</option>
            </select>
          </div>
          <div>
            <label className="form-label">Data Início</label>
            <input
              type="date"
              className="form-input"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Data Fim</label>
            <input
              type="date"
              className="form-input"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={limparFiltros}
              className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
        </div>
      ) : consultas.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-5xl mb-4 block">📭</span>
          <p className="text-gray-500 text-lg">Nenhuma consulta encontrada</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-xl shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {consultas.map((consulta) => (
                <tr key={consulta.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{formatarData(consulta.data_consulta.split('T')[0])}</p>
                    <p className="text-sm text-emerald-600 font-semibold">{formatarHora(consulta.hora_consulta)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{consulta.paciente_nome}</p>
                    <p className="text-xs text-gray-500">{consulta.paciente_cpf}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm">{consulta.paciente_telefone}</p>
                    <p className="text-xs text-gray-500">{consulta.paciente_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">
                      {consulta.tipo_atendimento === 'convenio' ? consulta.convenio_nome : 'Particular'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(consulta.status)}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    {consulta.observacoes_medico ? (
                      <p className="text-sm text-gray-600 truncate" title={consulta.observacoes_medico}>
                        {consulta.observacoes_medico}
                      </p>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Contagem */}
      {!loading && consultas.length > 0 && (
        <p className="text-sm text-gray-500 mt-4 text-right">
          Total: {consultas.length} consulta(s)
        </p>
      )}
    </div>
  );
}
