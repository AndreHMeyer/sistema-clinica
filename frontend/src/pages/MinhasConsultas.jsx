import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MinhasConsultas() {
  const [consultas, setConsultas] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [loading, setLoading] = useState(true);
  const [modalCancelar, setModalCancelar] = useState(null);
  const [modalRemarcar, setModalRemarcar] = useState(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [novaData, setNovaData] = useState('');
  const [novoHorario, setNovoHorario] = useState('');
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    loadConsultas();
  }, [filtro]);

  const loadConsultas = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/consultas/minhas?tipo=${filtro}`);
      setConsultas(response.data);
    } catch (error) {
      toast.error('Erro ao carregar consultas');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data) => {
    return format(new Date(data + 'T00:00:00'), "dd/MM/yyyy (EEEE)", { locale: ptBR });
  };

  const formatarHora = (hora) => {
    return hora.substring(0, 5);
  };

  const podeModificar = (consulta) => {
    if (!['agendada', 'remarcada'].includes(consulta.status)) return false;
    
    const dataHoraConsulta = new Date(`${consulta.data_consulta.split('T')[0]}T${consulta.hora_consulta}`);
    const agora = new Date();
    const diferencaHoras = (dataHoraConsulta - agora) / (1000 * 60 * 60);
    
    return diferencaHoras >= 24;
  };

  const handleCancelar = async () => {
    setLoadingAction(true);
    try {
      await api.put(`/consultas/${modalCancelar.id}/cancelar`, {
        motivo: motivoCancelamento
      });
      toast.success('Consulta cancelada com sucesso!');
      setModalCancelar(null);
      setMotivoCancelamento('');
      loadConsultas();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao cancelar consulta');
    } finally {
      setLoadingAction(false);
    }
  };

  const loadHorariosRemarcar = async (medicoId, data) => {
    try {
      const response = await api.get(
        `/consultas/medicos/${medicoId}/horarios?data=${data}`
      );
      setHorariosDisponiveis(response.data.horarios || []);
    } catch (error) {
      setHorariosDisponiveis([]);
    }
  };

  const handleDataRemarcarChange = async (e) => {
    const data = e.target.value;
    setNovaData(data);
    setNovoHorario('');
    if (data && modalRemarcar) {
      await loadHorariosRemarcar(modalRemarcar.medico_id, data);
    }
  };

  const handleRemarcar = async () => {
    if (!novaData || !novoHorario) {
      toast.error('Selecione a nova data e horário');
      return;
    }

    setLoadingAction(true);
    try {
      await api.put(`/consultas/${modalRemarcar.id}/remarcar`, {
        nova_data: novaData,
        novo_horario: novoHorario
      });
      toast.success('Consulta remarcada com sucesso!');
      setModalRemarcar(null);
      setNovaData('');
      setNovoHorario('');
      setHorariosDisponiveis([]);
      loadConsultas();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao remarcar consulta');
    } finally {
      setLoadingAction(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      agendada: 'badge-agendada',
      remarcada: 'badge-remarcada',
      realizada: 'badge-realizada',
      cancelada: 'badge-cancelada',
      falta: 'badge-falta'
    };
    const labels = {
      agendada: 'Agendada',
      remarcada: 'Remarcada',
      realizada: 'Realizada',
      cancelada: 'Cancelada',
      falta: 'Falta'
    };
    return (
      <span className={`badge ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return format(tomorrow, 'yyyy-MM-dd');
  };

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        📋 Minhas Consultas
      </h1>
      <p className="text-gray-600 mb-6">
        Visualize, cancele ou remarque suas consultas
      </p>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { value: 'todas', label: 'Todas' },
          { value: 'futuras', label: 'Futuras' },
          { value: 'passadas', label: 'Passadas' }
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filtro === f.value
                ? 'bg-clinic text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de Consultas */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-clinic"></div>
        </div>
      ) : consultas.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-5xl mb-4 block">📭</span>
          <p className="text-gray-500 text-lg">Nenhuma consulta encontrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {consultas.map((consulta) => (
            <div key={consulta.id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Informações da Consulta */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-clinic/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🩺</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{consulta.especialidade}</h3>
                    <p className="text-gray-600">{consulta.medico_nome}</p>
                    <p className="text-sm text-gray-500">CRM: {consulta.crm}</p>
                  </div>
                </div>

                {/* Data e Status */}
                <div className="flex flex-col md:items-end gap-2">
                  <div className="text-right">
                    <p className="font-medium text-gray-800">
                      {formatarData(consulta.data_consulta.split('T')[0])}
                    </p>
                    <p className="text-lg font-bold text-clinic">
                      {formatarHora(consulta.hora_consulta)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(consulta.status)}
                    <span className="text-xs text-gray-500">
                      {consulta.tipo_atendimento === 'convenio' 
                        ? consulta.convenio_nome 
                        : 'Particular'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              {podeModificar(consulta) && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2 justify-end">
                  <button
                    onClick={() => setModalRemarcar(consulta)}
                    className="px-4 py-2 text-sm font-medium text-yellow-600 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                  >
                    📅 Remarcar
                  </button>
                  <button
                    onClick={() => setModalCancelar(consulta)}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    ✕ Cancelar
                  </button>
                </div>
              )}

              {/* Motivo de cancelamento */}
              {consulta.status === 'cancelada' && consulta.motivo_cancelamento && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    <strong>Motivo:</strong> {consulta.motivo_cancelamento}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Cancelar */}
      {modalCancelar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-fadeIn">
            <h3 className="text-xl font-semibold mb-4">Cancelar Consulta</h3>
            <p className="text-gray-600 mb-4">
              Tem certeza que deseja cancelar a consulta com{' '}
              <strong>{modalCancelar.medico_nome}</strong> em{' '}
              <strong>{formatarData(modalCancelar.data_consulta.split('T')[0])}</strong>?
            </p>
            <div className="mb-4">
              <label className="form-label">Motivo (opcional)</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Informe o motivo do cancelamento..."
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setModalCancelar(null); setMotivoCancelamento(''); }}
                className="btn btn-secondary flex-1"
              >
                Voltar
              </button>
              <button
                onClick={handleCancelar}
                disabled={loadingAction}
                className="btn btn-danger flex-1"
              >
                {loadingAction ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Remarcar */}
      {modalRemarcar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-fadeIn">
            <h3 className="text-xl font-semibold mb-4">Remarcar Consulta</h3>
            <p className="text-gray-600 mb-4">
              Escolha uma nova data e horário para sua consulta com{' '}
              <strong>{modalRemarcar.medico_nome}</strong>
            </p>
            
            <div className="mb-4">
              <label className="form-label">Nova Data</label>
              <input
                type="date"
                className="form-input"
                value={novaData}
                onChange={handleDataRemarcarChange}
                min={getMinDate()}
              />
            </div>

            {novaData && (
              <div className="mb-4">
                <label className="form-label">Novo Horário</label>
                {horariosDisponiveis.length === 0 ? (
                  <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                    Nenhum horário disponível nesta data
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {horariosDisponiveis.map((h) => (
                      <button
                        key={h.horario}
                        onClick={() => setNovoHorario(h.horario)}
                        className={`p-2 border rounded-lg text-sm font-medium transition-colors ${
                          novoHorario === h.horario
                            ? 'bg-clinic text-white border-clinic'
                            : 'border-gray-200 hover:border-clinic'
                        }`}
                      >
                        {h.horario}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { 
                  setModalRemarcar(null); 
                  setNovaData(''); 
                  setNovoHorario(''); 
                  setHorariosDisponiveis([]);
                }}
                className="btn btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemarcar}
                disabled={loadingAction || !novaData || !novoHorario}
                className="btn btn-primary flex-1"
              >
                {loadingAction ? 'Remarcando...' : 'Confirmar Remarcação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
