import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function Perfil() {
  const { paciente, updateProfile } = useAuth();
  const [convenios, setConvenios] = useState([]);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    loadConvenios();
    if (paciente) {
      setValue('nome', paciente.nome);
      setValue('telefone', paciente.telefone);
      setValue('convenio_id', paciente.convenio_id ? String(paciente.convenio_id) : '');
    }
  }, [paciente, setValue]);

  const loadConvenios = async () => {
    try {
      const response = await api.get('/auth/convenios');
      setConvenios(response.data);
    } catch (error) {
      console.error('Erro ao carregar convênios:', error);
    }
  };

  // Formatar telefone
  const formatPhone = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const onSubmit = async (data) => {
    setLoading(true);
    const result = await updateProfile({
      nome: data.nome,
      telefone: data.telefone,
      convenio_id: data.convenio_id ? parseInt(data.convenio_id, 10) : null
    });
    setLoading(false);

    if (result.success) {
      toast.success('Perfil atualizado com sucesso!');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="animate-fadeIn max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        👤 Meu Perfil
      </h1>
      <p className="text-gray-600 mb-8">
        Atualize suas informações pessoais
      </p>

      <div className="card">
        {/* Avatar e info básica */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
          <div className="w-20 h-20 bg-clinic/10 rounded-full flex items-center justify-center">
            <span className="text-4xl">👤</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{paciente?.nome}</h2>
            <p className="text-gray-500">{paciente?.email}</p>
            {paciente?.bloqueado && (
              <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                Conta bloqueada
              </span>
            )}
          </div>
        </div>

        {/* Dados não editáveis */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Dados não editáveis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">CPF</label>
              <p className="font-medium">{paciente?.cpf}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">E-mail</label>
              <p className="font-medium">{paciente?.email}</p>
            </div>
          </div>
        </div>

        {/* Formulário de edição */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Nome */}
          <div>
            <label className="form-label">Nome Completo</label>
            <input
              type="text"
              className={`form-input ${errors.nome ? 'border-red-500' : ''}`}
              {...register('nome', {
                required: 'Nome é obrigatório',
                minLength: {
                  value: 3,
                  message: 'Nome deve ter pelo menos 3 caracteres'
                }
              })}
            />
            {errors.nome && <p className="form-error">{errors.nome.message}</p>}
          </div>

          {/* Telefone */}
          <div>
            <label className="form-label">Telefone</label>
            <input
              type="text"
              className={`form-input ${errors.telefone ? 'border-red-500' : ''}`}
              maxLength={15}
              {...register('telefone', {
                required: 'Telefone é obrigatório',
                pattern: {
                  value: /^\(\d{2}\) \d{5}-\d{4}$/,
                  message: 'Telefone inválido'
                },
                onChange: (e) => {
                  e.target.value = formatPhone(e.target.value);
                }
              })}
            />
            {errors.telefone && <p className="form-error">{errors.telefone.message}</p>}
          </div>

          {/* Convênio */}
          <div>
            <label className="form-label">Convênio</label>
            <select
              className="form-input"
              {...register('convenio_id')}
            >
              <option value="">Particular (sem convênio)</option>
              {convenios.filter(c => c.codigo !== 'PARTICULAR').map((convenio) => (
                <option key={convenio.id} value={convenio.id}>
                  {convenio.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Botão de salvar */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Salvando...
              </>
            ) : (
              <>
                💾 Salvar Alterações
              </>
            )}
          </button>
        </form>

        {/* Estatísticas */}
        {paciente?.faltas_consecutivas > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Atenção</h3>
            <p className="text-sm text-yellow-700">
              Você possui <strong>{paciente.faltas_consecutivas}</strong> falta(s) consecutiva(s).
              {paciente.faltas_consecutivas >= 2 && (
                <span className="block mt-1">
                  Mais uma falta e sua conta será bloqueada!
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
