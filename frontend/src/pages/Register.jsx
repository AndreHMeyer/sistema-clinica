import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function Register() {
  const { register: registerUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [convenios, setConvenios] = useState([]);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const senha = watch('senha');

  useEffect(() => {
    loadConvenios();
  }, []);

  const loadConvenios = async () => {
    try {
      const response = await api.get('/auth/convenios');
      setConvenios(response.data);
    } catch (error) {
      console.error('Erro ao carregar convênios:', error);
    }
  };

  // Formatar CPF
  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
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
    
    const dadosCadastro = {
      cpf: data.cpf,
      nome: data.nome,
      email: data.email,
      senha: data.senha,
      telefone: data.telefone,
      convenio_id: data.convenio_id || null
    };

    const result = await registerUser(dadosCadastro);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success('Cadastro realizado com sucesso!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-clinic rounded-full mb-4">
            <span className="text-3xl">🏥</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Clínica Saúde+</h1>
          <p className="text-gray-600 mt-2">Crie sua conta para agendar consultas</p>
        </div>

        {/* Card de Cadastro */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Cadastro de Paciente
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* CPF */}
            <div>
              <label className="form-label">CPF *</label>
              <input
                type="text"
                className={`form-input ${errors.cpf ? 'border-red-500' : ''}`}
                placeholder="000.000.000-00"
                maxLength={14}
                {...register('cpf', {
                  required: 'CPF é obrigatório',
                  pattern: {
                    value: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
                    message: 'CPF inválido'
                  },
                  onChange: (e) => {
                    e.target.value = formatCPF(e.target.value);
                  }
                })}
              />
              {errors.cpf && <p className="form-error">{errors.cpf.message}</p>}
            </div>

            {/* Nome */}
            <div>
              <label className="form-label">Nome Completo *</label>
              <input
                type="text"
                className={`form-input ${errors.nome ? 'border-red-500' : ''}`}
                placeholder="Digite seu nome completo"
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

            {/* Email */}
            <div>
              <label className="form-label">E-mail *</label>
              <input
                type="email"
                className={`form-input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="seu@email.com"
                {...register('email', {
                  required: 'E-mail é obrigatório',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'E-mail inválido'
                  }
                })}
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            {/* Telefone */}
            <div>
              <label className="form-label">Telefone *</label>
              <input
                type="text"
                className={`form-input ${errors.telefone ? 'border-red-500' : ''}`}
                placeholder="(00) 00000-0000"
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
              <label className="form-label">Convênio (opcional)</label>
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

            {/* Senha */}
            <div>
              <label className="form-label">Senha *</label>
              <input
                type="password"
                className={`form-input ${errors.senha ? 'border-red-500' : ''}`}
                placeholder="8 a 20 caracteres"
                {...register('senha', {
                  required: 'Senha é obrigatória',
                  minLength: {
                    value: 8,
                    message: 'Senha deve ter no mínimo 8 caracteres'
                  },
                  maxLength: {
                    value: 20,
                    message: 'Senha deve ter no máximo 20 caracteres'
                  },
                  validate: {
                    hasUppercase: value => /[A-Z]/.test(value) || 'Senha deve conter pelo menos uma letra maiúscula',
                    hasLowercase: value => /[a-z]/.test(value) || 'Senha deve conter pelo menos uma letra minúscula',
                    hasNumber: value => /[0-9]/.test(value) || 'Senha deve conter pelo menos um número',
                    hasSymbol: value => /[!@#$%^&*(),.?":{}|<>]/.test(value) || 'Senha deve conter pelo menos um caractere especial (!@#$%^&*)'
                  }
                })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Deve conter: maiúscula, minúscula, número e caractere especial
              </p>
              {errors.senha && <p className="form-error">{errors.senha.message}</p>}
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="form-label">Confirmar Senha *</label>
              <input
                type="password"
                className={`form-input ${errors.confirmarSenha ? 'border-red-500' : ''}`}
                placeholder="Repita a senha"
                {...register('confirmarSenha', {
                  required: 'Confirmação de senha é obrigatória',
                  validate: value => value === senha || 'As senhas não conferem'
                })}
              />
              {errors.confirmarSenha && <p className="form-error">{errors.confirmarSenha.message}</p>}
            </div>

            {/* Botão de Cadastro */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-6"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Cadastrando...
                </>
              ) : (
                <>
                  Criar Conta
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Link para login */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-clinic font-semibold hover:underline">
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
