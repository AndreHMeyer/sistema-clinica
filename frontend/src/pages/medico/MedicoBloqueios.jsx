import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import medicoApi from '../../services/medicoApi';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MedicoBloqueios() {
  const [bloqueios, setBloqueios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAdd, setModalAdd] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // Form state
  const [data, setData] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('18:00');
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    loadBloqueios();
  }, []);

  const loadBloqueios = async () => {
    try {
      const response = await medicoApi.get('/medico/bloqueios');
      setBloqueios(response.data);
    } catch (error) {
      toast.error('Erro ao carregar bloqueios');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBloqueio = async (e) => {
    e.preventDefault();
    setLoadingAction(true);

    try {
      await medicoApi.post('/medico/bloqueios', {
        data,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        motivo
      });
      toast.success('Bloqueio adicionado com sucesso!');
      setModalAdd(false);
      resetForm();
      loadBloqueios();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao adicionar bloqueio');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async (bloqueioId) => {
    if (!confirm('Tem certeza que deseja remover este bloqueio?')) return;

    try {
      await medicoApi.delete(`/medico/bloqueios/${bloqueioId}`);
      toast.success('Bloqueio removido com sucesso!');
      loadBloqueios();
    } catch (error) {
      toast.error('Erro ao remover bloqueio');
    }
  };

  const resetForm = () => {
    setData(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    setHoraInicio('08:00');
    setHoraFim('18:00');
    setMotivo('');
  };

  const formatarData = (dataStr) => {
    return format(new Date(dataStr + 'T00:00:00'), "dd/MM/yyyy (EEEE)", { locale: ptBR });
  };

  const formatarHora = (hora) => hora.substring(0, 5);

  const getMinDate = () => format(new Date(), 'yyyy-MM-dd');

  // Bloqueio rápido para o dia todo
  const handleBloqueioRapido = (diasAfrente) => {
    const novaData = format(addDays(new Date(), diasAfrente), 'yyyy-MM-dd');
    setData(novaData);
    setHoraInicio('00:00');
    setHoraFim('23:59');
    setMotivo('Dia inteiro bloqueado');
    setModalAdd(true);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🚫 Bloqueios de Horário</h1>
          <p className="text-gray-600">Bloqueie horários em caso de imprevistos</p>
        </div>
        <button
          onClick={() => setModalAdd(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center gap-2"
        >
          <span>+</span> Novo Bloqueio
        </button>
      </div>

      {/* Bloqueios rápidos */}
      <div className="card mb-6">
        <h3 className="font-medium text-gray-700 mb-3">⚡ Bloqueio Rápido (dia inteiro)</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleBloqueioRapido(1)}
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            Amanhã
          </button>
          <button
            onClick={() => handleBloqueioRapido(2)}
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            +2 dias
          </button>
          <button
            onClick={() => handleBloqueioRapido(7)}
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            +7 dias
          </button>
        </div>
      </div>

      {/* Lista de Bloqueios */}
      {bloqueios.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-5xl mb-4 block">✅</span>
          <p className="text-gray-500 text-lg">Nenhum bloqueio futuro cadastrado</p>
          <p className="text-gray-400 text-sm mt-2">Seus horários estão livres para agendamentos</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bloqueios.map((bloqueio) => (
            <div key={bloqueio.id} className="card border-l-4 border-red-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🚫</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {formatarData(bloqueio.data)}
                    </h3>
                    <p className="text-gray-600">
                      {formatarHora(bloqueio.hora_inicio)} às {formatarHora(bloqueio.hora_fim)}
                    </p>
                    {bloqueio.motivo && (
                      <p className="text-sm text-gray-500 mt-1">
                        <em>"{bloqueio.motivo}"</em>
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(bloqueio.id)}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                >
                  🗑️ Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
        <h4 className="font-medium text-yellow-800 mb-2">⚠️ Atenção</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Bloqueios impedem novos agendamentos no período selecionado</li>
          <li>• Não é possível bloquear horários que já possuem consultas agendadas</li>
          <li>• Cancele primeiro as consultas existentes se necessário</li>
        </ul>
      </div>

      {/* Modal Adicionar Bloqueio */}
      {modalAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-fadeIn">
            <h3 className="text-xl font-semibold mb-4">🚫 Novo Bloqueio</h3>
            
            <form onSubmit={handleAddBloqueio} className="space-y-4">
              <div>
                <label className="form-label">Data</label>
                <input
                  type="date"
                  className="form-input"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  min={getMinDate()}
                  required
                />
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
                <label className="form-label">Motivo (opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Compromisso pessoal, Congresso médico..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
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
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                >
                  {loadingAction ? 'Salvando...' : 'Bloquear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
