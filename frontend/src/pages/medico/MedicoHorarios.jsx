import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import medicoApi from '../../services/medicoApi';

export default function MedicoHorarios() {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAdd, setModalAdd] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  
  // Form state
  const [diaSemana, setDiaSemana] = useState(1);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('12:00');
  const [duracaoConsulta, setDuracaoConsulta] = useState(30);

  const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  useEffect(() => {
    loadHorarios();
  }, []);

  const loadHorarios = async () => {
    try {
      const response = await medicoApi.get('/medico/horarios');
      setHorarios(response.data);
    } catch (error) {
      toast.error('Erro ao carregar horários');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHorario = async (e) => {
    e.preventDefault();
    setLoadingAction(true);

    try {
      await medicoApi.post('/medico/horarios', {
        dia_semana: diaSemana,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        duracao_consulta: duracaoConsulta
      });
      toast.success('Horário adicionado com sucesso!');
      setModalAdd(false);
      resetForm();
      loadHorarios();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao adicionar horário');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleToggleAtivo = async (horarioId, ativo) => {
    try {
      const horario = horarios.flatMap(d => d.horarios).find(h => h.id === horarioId);
      await medicoApi.put(`/medico/horarios/${horarioId}`, {
        hora_inicio: horario.hora_inicio,
        hora_fim: horario.hora_fim,
        duracao_consulta: horario.duracao_consulta,
        ativo: !ativo
      });
      toast.success(ativo ? 'Horário desativado' : 'Horário ativado');
      loadHorarios();
    } catch (error) {
      toast.error('Erro ao atualizar horário');
    }
  };

  const handleDelete = async (horarioId) => {
    if (!confirm('Tem certeza que deseja remover este horário?')) return;

    try {
      await medicoApi.delete(`/medico/horarios/${horarioId}`);
      toast.success('Horário removido com sucesso!');
      loadHorarios();
    } catch (error) {
      toast.error('Erro ao remover horário');
    }
  };

  const resetForm = () => {
    setDiaSemana(1);
    setHoraInicio('08:00');
    setHoraFim('12:00');
    setDuracaoConsulta(30);
  };

  const formatarHora = (hora) => hora.substring(0, 5);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">⏰ Horários de Atendimento</h1>
          <p className="text-gray-600">Configure seus horários disponíveis para consultas</p>
        </div>
        <button
          onClick={() => setModalAdd(true)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 flex items-center gap-2"
        >
          <span>+</span> Adicionar Horário
        </button>
      </div>

      {/* Grade de horários por dia */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {horarios.map((dia) => (
          <div key={dia.dia_semana} className="card">
            <h3 className={`font-semibold text-lg mb-4 pb-2 border-b ${
              dia.horarios.length > 0 ? 'text-emerald-700' : 'text-gray-400'
            }`}>
              {dia.dia_nome}
            </h3>
            
            {dia.horarios.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">
                Sem horários configurados
              </p>
            ) : (
              <div className="space-y-3">
                {dia.horarios.map((h) => (
                  <div
                    key={h.id}
                    className={`p-3 rounded-lg border ${
                      h.ativo 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">
                          {formatarHora(h.hora_inicio)} - {formatarHora(h.hora_fim)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Consulta: {h.duracao_consulta} min
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleAtivo(h.id, h.ativo)}
                          className={`p-1.5 rounded-lg text-xs ${
                            h.ativo 
                              ? 'text-yellow-600 hover:bg-yellow-100' 
                              : 'text-green-600 hover:bg-green-100'
                          }`}
                          title={h.ativo ? 'Desativar' : 'Ativar'}
                        >
                          {h.ativo ? '⏸️' : '▶️'}
                        </button>
                        <button
                          onClick={() => handleDelete(h.id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 text-xs"
                          title="Remover"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <h4 className="font-medium text-gray-700 mb-2">ℹ️ Informações</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Os horários ativos são exibidos para os pacientes no agendamento</li>
          <li>• Você pode desativar temporariamente um horário sem removê-lo</li>
          <li>• Horários com consultas agendadas não podem ser removidos</li>
        </ul>
      </div>

      {/* Modal Adicionar Horário */}
      {modalAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-fadeIn">
            <h3 className="text-xl font-semibold mb-4">➕ Adicionar Horário</h3>
            
            <form onSubmit={handleAddHorario} className="space-y-4">
              <div>
                <label className="form-label">Dia da Semana</label>
                <select
                  className="form-input"
                  value={diaSemana}
                  onChange={(e) => setDiaSemana(Number(e.target.value))}
                >
                  {diasSemana.map((dia, index) => (
                    <option key={index} value={index}>{dia}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Hora Início</label>
                  <input
                    type="time"
                    className="form-input"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Hora Fim</label>
                  <input
                    type="time"
                    className="form-input"
                    value={horaFim}
                    onChange={(e) => setHoraFim(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Duração da Consulta (minutos)</label>
                <select
                  className="form-input"
                  value={duracaoConsulta}
                  onChange={(e) => setDuracaoConsulta(Number(e.target.value))}
                >
                  <option value={15}>15 minutos</option>
                  <option value={20}>20 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setModalAdd(false); resetForm(); }}
                  className="btn btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                >
                  {loadingAction ? 'Salvando...' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
