import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const { paciente } = useAuth();
  const [consultasFuturas, setConsultasFuturas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConsultasFuturas();
  }, []);

  const loadConsultasFuturas = async () => {
    try {
      const response = await api.get('/consultas/minhas?tipo=futuras');
      setConsultasFuturas(response.data.slice(0, 3)); // Mostrar só as 3 próximas
    } catch (error) {
      console.error('Erro ao carregar consultas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data) => {
    if (!data) return '';
    try {
      // Se vier como ISO string (2025-11-27T00:00:00.000Z), pega só a parte da data
      const dataStr = data.toString().split('T')[0];
      return format(new Date(dataStr + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', data, error);
      return data;
    }
  };

  const formatarHora = (hora) => {
    if (!hora) return '';
    return hora.toString().substring(0, 5);
  };

  return (
    <div className="animate-fadeIn">
      {/* Header de boas vindas */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Olá, {paciente?.nome?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Bem-vindo ao sistema de agendamentos da Clínica Saúde+
        </p>
      </div>

      {/* Cards de ações rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          to="/agendar"
          className="card hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-clinic/10 rounded-xl flex items-center justify-center group-hover:bg-clinic/20 transition-colors">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Agendar Consulta</h3>
              <p className="text-sm text-gray-500">Marque uma nova consulta</p>
            </div>
          </div>
        </Link>

        <Link
          to="/consultas"
          className="card hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Minhas Consultas</h3>
              <p className="text-sm text-gray-500">Veja seu histórico completo</p>
            </div>
          </div>
        </Link>

        <Link
          to="/perfil"
          className="card hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Meu Perfil</h3>
              <p className="text-sm text-gray-500">Atualize seus dados</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Próximas consultas */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            📌 Próximas Consultas
          </h2>
          {consultasFuturas.length > 0 && (
            <Link
              to="/consultas"
              className="text-sm text-clinic hover:underline font-medium"
            >
              Ver todas →
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-clinic"></div>
          </div>
        ) : consultasFuturas.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📭</span>
            <p className="text-gray-500 mb-4">Você não tem consultas agendadas</p>
            <Link to="/agendar" className="btn btn-primary inline-flex">
              Agendar agora
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {consultasFuturas.map((consulta) => (
              <div
                key={consulta.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-clinic/10 rounded-xl flex items-center justify-center">
                    <span className="text-xl">🩺</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">
                      {consulta.especialidade}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {consulta.medico_nome}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800">
                    {formatarData(consulta.data_consulta)}
                  </p>
                  <p className="text-sm text-clinic font-semibold">
                    {formatarHora(consulta.hora_consulta)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informações importantes */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold text-yellow-800 flex items-center gap-2">
            <span>⚠️</span> Regras Importantes
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-yellow-700">
            <li>• Cancelamentos só até 24h antes da consulta</li>
            <li>• Máximo de 2 consultas futuras por vez</li>
            <li>• 3 faltas seguidas = bloqueio da conta</li>
          </ul>
        </div>

        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-800 flex items-center gap-2">
            <span>ℹ️</span> Seus Dados
          </h3>
          <div className="mt-3 space-y-2 text-sm text-blue-700">
            <p><strong>CPF:</strong> {paciente?.cpf}</p>
            <p><strong>E-mail:</strong> {paciente?.email}</p>
            <p><strong>Convênio:</strong> {paciente?.convenio_nome || 'Particular'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
