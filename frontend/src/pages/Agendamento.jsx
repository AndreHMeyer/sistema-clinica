import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { format, addDays, startOfDay, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Agendamento() {
  const navigate = useNavigate();
  const { paciente } = useAuth();
  
  // Estados
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Dados do formulário
  const [especialidades, setEspecialidades] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  
  // Seleções
  const [especialidadeSelecionada, setEspecialidadeSelecionada] = useState(null);
  const [medicoSelecionado, setMedicoSelecionado] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [horarioSelecionado, setHorarioSelecionado] = useState('');
  const [tipoAtendimento, setTipoAtendimento] = useState(paciente?.convenio_id ? 'convenio' : 'particular');

  // Carregar especialidades
  useEffect(() => {
    loadEspecialidades();
  }, []);

  // Carregar médicos quando especialidade mudar
  useEffect(() => {
    if (especialidadeSelecionada) {
      loadMedicos();
    }
  }, [especialidadeSelecionada]);

  // Carregar horários quando médico ou data mudar
  useEffect(() => {
    if (medicoSelecionado && dataSelecionada) {
      loadHorarios();
    }
  }, [medicoSelecionado, dataSelecionada]);

  const loadEspecialidades = async () => {
    try {
      const response = await api.get('/consultas/especialidades');
      setEspecialidades(response.data);
    } catch (error) {
      toast.error('Erro ao carregar especialidades');
    }
  };

  const loadMedicos = async () => {
    setLoading(true);
    try {
      let url = `/consultas/medicos/especialidade/${especialidadeSelecionada.id}`;
      if (paciente?.convenio_id && tipoAtendimento === 'convenio') {
        url += `?convenioId=${paciente.convenio_id}`;
      }
      const response = await api.get(url);
      setMedicos(response.data);
    } catch (error) {
      toast.error('Erro ao carregar médicos');
    } finally {
      setLoading(false);
    }
  };

  const loadHorarios = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/consultas/medicos/${medicoSelecionado.id}/horarios?data=${dataSelecionada}`
      );
      setHorarios(response.data.horarios || []);
      if (response.data.horarios?.length === 0) {
        toast.info(response.data.message || 'Nenhum horário disponível nesta data');
      }
    } catch (error) {
      toast.error('Erro ao carregar horários');
      setHorarios([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEspecialidadeSelect = (esp) => {
    setEspecialidadeSelecionada(esp);
    setMedicoSelecionado(null);
    setDataSelecionada('');
    setHorarioSelecionado('');
    setHorarios([]);
    setStep(2);
  };

  const handleMedicoSelect = (med) => {
    setMedicoSelecionado(med);
    setDataSelecionada('');
    setHorarioSelecionado('');
    setHorarios([]);
    setStep(3);
  };

  const handleDataChange = (e) => {
    setDataSelecionada(e.target.value);
    setHorarioSelecionado('');
  };

  const handleHorarioSelect = (horario) => {
    setHorarioSelecionado(horario);
    setStep(4);
  };

  const handleConfirmar = async () => {
    setLoading(true);
    try {
      await api.post('/consultas/agendar', {
        medico_id: medicoSelecionado.id,
        data_consulta: dataSelecionada,
        hora_consulta: horarioSelecionado,
        tipo_atendimento: tipoAtendimento
      });
      
      toast.success('Consulta agendada com sucesso!');
      navigate('/consultas');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao agendar consulta');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    return format(addDays(new Date(), 1), 'yyyy-MM-dd');
  };

  const getMaxDate = () => {
    return format(addDays(new Date(), 60), 'yyyy-MM-dd');
  };

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        📅 Agendar Consulta
      </h1>
      <p className="text-gray-600 mb-8">
        Selecione a especialidade, médico, data e horário desejados
      </p>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s
                  ? 'bg-clinic text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s}
            </div>
            {s < 4 && (
              <div
                className={`w-12 md:w-24 h-1 mx-2 ${
                  step > s ? 'bg-clinic' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Especialidade */}
      <div className={`card mb-6 ${step < 1 ? 'opacity-50' : ''}`}>
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-clinic/10 rounded-full flex items-center justify-center text-sm">1</span>
          Escolha a Especialidade
        </h2>
        
        {especialidadeSelecionada && step > 1 ? (
          <div className="flex items-center justify-between p-3 bg-clinic/10 rounded-lg">
            <span className="font-medium text-clinic">{especialidadeSelecionada.nome}</span>
            <button
              onClick={() => { setStep(1); setEspecialidadeSelecionada(null); }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Alterar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {especialidades.map((esp) => (
              <button
                key={esp.id}
                onClick={() => handleEspecialidadeSelect(esp)}
                className="p-4 border border-gray-200 rounded-xl hover:border-clinic hover:bg-clinic/5 transition-all text-center"
              >
                <span className="text-2xl mb-2 block">🩺</span>
                <span className="text-sm font-medium">{esp.nome}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Médico */}
      {step >= 2 && (
        <div className={`card mb-6 ${step < 2 ? 'opacity-50' : ''}`}>
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-clinic/10 rounded-full flex items-center justify-center text-sm">2</span>
            Escolha o Médico
          </h2>

          {/* Tipo de Atendimento */}
          {paciente?.convenio_id && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Tipo de Atendimento:
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoAtendimento"
                    value="convenio"
                    checked={tipoAtendimento === 'convenio'}
                    onChange={(e) => setTipoAtendimento(e.target.value)}
                    className="w-4 h-4 text-clinic"
                  />
                  <span className="text-sm">Convênio ({paciente.convenio_nome})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoAtendimento"
                    value="particular"
                    checked={tipoAtendimento === 'particular'}
                    onChange={(e) => setTipoAtendimento(e.target.value)}
                    className="w-4 h-4 text-clinic"
                  />
                  <span className="text-sm">Particular</span>
                </label>
              </div>
            </div>
          )}

          {medicoSelecionado && step > 2 ? (
            <div className="flex items-center justify-between p-3 bg-clinic/10 rounded-lg">
              <div>
                <span className="font-medium text-clinic">{medicoSelecionado.nome}</span>
                <span className="text-sm text-gray-500 ml-2">CRM: {medicoSelecionado.crm}</span>
              </div>
              <button
                onClick={() => { setStep(2); setMedicoSelecionado(null); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Alterar
              </button>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-clinic"></div>
            </div>
          ) : medicos.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhum médico disponível para esta especialidade
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {medicos.map((med) => (
                <button
                  key={med.id}
                  onClick={() => handleMedicoSelect(med)}
                  className="p-4 border border-gray-200 rounded-xl hover:border-clinic hover:bg-clinic/5 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">👨‍⚕️</span>
                    </div>
                    <div>
                      <p className="font-medium">{med.nome}</p>
                      <p className="text-sm text-gray-500">CRM: {med.crm}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Data e Horário */}
      {step >= 3 && (
        <div className={`card mb-6 ${step < 3 ? 'opacity-50' : ''}`}>
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-clinic/10 rounded-full flex items-center justify-center text-sm">3</span>
            Escolha Data e Horário
          </h2>

          {horarioSelecionado && step > 3 ? (
            <div className="flex items-center justify-between p-3 bg-clinic/10 rounded-lg">
              <div>
                <span className="font-medium text-clinic">
                  {format(new Date(dataSelecionada + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                <span className="text-sm text-gray-500 ml-2">às {horarioSelecionado}</span>
              </div>
              <button
                onClick={() => { setStep(3); setHorarioSelecionado(''); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Alterar
              </button>
            </div>
          ) : (
            <>
              {/* Seleção de Data */}
              <div className="mb-4">
                <label className="form-label">Selecione a Data</label>
                <input
                  type="date"
                  className="form-input"
                  value={dataSelecionada}
                  onChange={handleDataChange}
                  min={getMinDate()}
                  max={getMaxDate()}
                />
              </div>

              {/* Horários Disponíveis */}
              {dataSelecionada && (
                <div>
                  <label className="form-label">Horários Disponíveis</label>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-clinic"></div>
                    </div>
                  ) : horarios.length === 0 ? (
                    <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                      Nenhum horário disponível nesta data. Tente outra data.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {horarios.map((h) => (
                        <button
                          key={h.horario}
                          onClick={() => handleHorarioSelect(h.horario)}
                          className="p-3 border border-gray-200 rounded-lg hover:border-clinic hover:bg-clinic hover:text-white transition-all text-center font-medium"
                        >
                          {h.horario}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Step 4: Confirmação */}
      {step >= 4 && (
        <div className="card mb-6 bg-green-50 border-green-200">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2 text-green-800">
            <span className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center text-sm">4</span>
            Confirmar Agendamento
          </h2>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between py-2 border-b border-green-200">
              <span className="text-gray-600">Especialidade:</span>
              <span className="font-medium">{especialidadeSelecionada?.nome}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-green-200">
              <span className="text-gray-600">Médico:</span>
              <span className="font-medium">{medicoSelecionado?.nome}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-green-200">
              <span className="text-gray-600">Data:</span>
              <span className="font-medium">
                {format(new Date(dataSelecionada + 'T00:00:00'), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-green-200">
              <span className="text-gray-600">Horário:</span>
              <span className="font-medium">{horarioSelecionado}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Tipo:</span>
              <span className="font-medium capitalize">
                {tipoAtendimento === 'convenio' ? paciente?.convenio_nome : 'Particular'}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="btn btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={loading}
              className="btn btn-success flex-1"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Agendando...
                </>
              ) : (
                <>
                  ✓ Confirmar Agendamento
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
