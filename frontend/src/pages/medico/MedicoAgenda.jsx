import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import medicoApi from '../../services/medicoApi';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MedicoAgenda() {
  const [consultas, setConsultas] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [modalObservacoes, setModalObservacoes] = useState(null);
  const [observacoes, setObservacoes] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    loadConsultas();
  }, [dataSelecionada]);

  const loadConsultas = async () => {
    setLoading(true);
    try {
      const response = await medicoApi.get(`/medico/consultas?data=${dataSelecionada}`);
      setConsultas(response.data);
    } catch (error) {
      toast.error('Erro ao carregar consultas');
    } finally {
      setLoading(false);
    }
  };

  const formatarHora = (hora) => hora.substring(0, 5);

  const handleMarcarRealizada = async (consultaId) => {
    try {
      await medicoApi.put(`/medico/consultas/${consultaId}/realizada`);
      toast.success('Consulta marcada como realizada!');
      loadConsultas();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao marcar consulta');
    }
  };

  const handleMarcarFalta = async (consultaId) => {
    if (!confirm('Confirma que o paciente faltou?')) return;
    
    try {
      const response = await medicoApi.put(`/medico/consultas/${consultaId}/falta`);
      toast.success('Falta registrada!');
      if (response.data.pacienteBloqueado) {
        toast.warning('Paciente foi bloqueado por 3 faltas consecutivas');
      }
      loadConsultas();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao registrar falta');
    }
  };

  const handleSalvarObservacoes = async () => {
    setLoadingAction(true);
    try {
      await medicoApi.put(`/medico/consultas/${modalObservacoes.id}/observacoes`, {
        observacoes
      });
      toast.success('Observações salvas com sucesso!');
      setModalObservacoes(null);
      setObservacoes('');
      loadConsultas();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar observações');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCancelar = async (consultaId) => {
    const motivo = prompt('Motivo do cancelamento:');
    if (!motivo) return;

    try {
      await medicoApi.put(`/medico/consultas/${consultaId}/cancelar`, { motivo });
      toast.success('Consulta cancelada!');
      loadConsultas();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao cancelar');
    }
  };

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

  // Navegação de datas rápida
  const diasRapidos = [
    { label: 'Hoje', date: format(new Date(), 'yyyy-MM-dd') },
    { label: 'Amanhã', date: format(addDays(new Date(), 1), 'yyyy-MM-dd') },
    { label: '+2 dias', date: format(addDays(new Date(), 2), 'yyyy-MM-dd') },
    { label: '+7 dias', date: format(addDays(new Date(), 7), 'yyyy-MM-dd') },
  ];

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">📅 Minha Agenda</h1>
      <p className="text-gray-600 mb-6">Visualize e gerencie suas consultas por data</p>

      {/* Seleção de data */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="form-label">Selecione a Data</label>
            <input
              type="date"
              className="form-input"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {diasRapidos.map((d) => (
              <button
                key={d.label}
                onClick={() => setDataSelecionada(d.date)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dataSelecionada === d.date
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 text-lg font-medium text-gray-800">
          {format(new Date(dataSelecionada + 'T00:00:00'), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Lista de Consultas */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
        </div>
      ) : consultas.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-5xl mb-4 block">📭</span>
          <p className="text-gray-500 text-lg">Nenhuma consulta agendada para esta data</p>
        </div>
      ) : (
        <div className="space-y-4">
          {consultas.map((consulta) => (
            <div key={consulta.id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Horário */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-emerald-600">
                      {formatarHora(consulta.hora_consulta)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{consulta.paciente_nome}</h3>
                    <p className="text-gray-500 text-sm">CPF: {consulta.paciente_cpf}</p>
                    <p className="text-gray-500 text-sm">📞 {consulta.paciente_telefone}</p>
                  </div>
                </div>

                {/* Info adicional */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(consulta.status)}
                    <span className="text-xs text-gray-500">
                      {consulta.tipo_atendimento === 'convenio' ? consulta.convenio_nome : 'Particular'}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                {['agendada', 'remarcada'].includes(consulta.status) && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setModalObservacoes(consulta);
                        setObservacoes(consulta.observacoes_medico || '');
                      }}
                      className="px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100"
                    >
                      📝 Observações
                    </button>
                    <button
                      onClick={() => handleMarcarRealizada(consulta.id)}
                      className="px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
                    >
                      ✓ Realizada
                    </button>
                    <button
                      onClick={() => handleMarcarFalta(consulta.id)}
                      className="px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100"
                    >
                      ✗ Falta
                    </button>
                    <button
                      onClick={() => handleCancelar(consulta.id)}
                      className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                    >
                      🚫 Cancelar
                    </button>
                  </div>
                )}

                {consulta.status === 'realizada' && consulta.observacoes_medico && (
                  <div className="lg:max-w-xs">
                    <p className="text-sm text-gray-600">
                      <strong>Obs:</strong> {consulta.observacoes_medico.substring(0, 100)}...
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Observações */}
      {modalObservacoes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg animate-fadeIn">
            <h3 className="text-xl font-semibold mb-2">📝 Registrar Observações</h3>
            <p className="text-gray-600 mb-4">
              Paciente: <strong>{modalObservacoes.paciente_nome}</strong>
            </p>
            
            <div className="mb-4">
              <label className="form-label">Observações da Consulta</label>
              <textarea
                className="form-input"
                rows={6}
                placeholder="Digite as observações médicas..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Estas observações são visíveis apenas para você e a administração.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setModalObservacoes(null); setObservacoes(''); }}
                className="btn btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarObservacoes}
                disabled={loadingAction}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                {loadingAction ? 'Salvando...' : 'Salvar e Marcar Realizada'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
