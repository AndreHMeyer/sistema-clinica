import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    const result = await login(data.email, data.senha);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success('Login realizado com sucesso!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-clinic rounded-full mb-4">
            <span className="text-3xl">🏥</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Clínica Saúde+</h1>
          <p className="text-gray-600 mt-2">Sistema de Agendamento de Consultas</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Entrar na sua conta
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="form-label">E-mail</label>
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

            {/* Senha */}
            <div>
              <label className="form-label">Senha</label>
              <input
                type="password"
                className={`form-input ${errors.senha ? 'border-red-500' : ''}`}
                placeholder="••••••••"
                {...register('senha', {
                  required: 'Senha é obrigatória'
                })}
              />
              {errors.senha && <p className="form-error">{errors.senha.message}</p>}
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Link para cadastro */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Não tem uma conta?{' '}
              <Link to="/cadastro" className="text-clinic font-semibold hover:underline">
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          © 2025 Clínica Saúde+ - Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
