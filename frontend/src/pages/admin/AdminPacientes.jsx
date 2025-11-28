import { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { 
  MagnifyingGlassIcon,
  LockClosedIcon,
  LockOpenIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default function AdminPacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroBloquados, setFiltroBloqueados] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingModal, setLoadingModal] = useState(false);

  useEffect(() => {
    loadPacientes();
  }, [filtroBloquados]);

  const loadPacientes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtroBloquados) params.append('bloqueados', 'true');
      
      const response = await adminApi.get(`/pacientes?${params}`);
      setPacientes(response.data);
    } catch (error) {
      toast.error('Erro ao carregar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const handleDesbloquear = async (id) => {
    if (!confirm('Deseja realmente desbloquear este paciente?')) return;
    
    try {
      await adminApi.post(`/pacientes/${id}/desbloquear`);
      toast.success('Paciente desbloqueado com sucesso!');
      loadPacientes();
      if (selectedPaciente?.id === id) {
        loadPacienteDetails(id);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao desbloquear paciente');
    }
  };

  const handleBloquear = async (id) => {
    if (!confirm('Deseja realmente bloquear este paciente?')) return;
    
    try {
      await adminApi.post(`/pacientes/${id}/bloquear`);
      toast.success('Paciente bloqueado com sucesso!');
      loadPacientes();
      if (selectedPaciente?.id === id) {
        loadPacienteDetails(id);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao bloquear paciente');
    }
  };

  const loadPacienteDetails = async (id) => {
    try {
      setLoadingModal(true);
      const response = await adminApi.get(`/pacientes/${id}`);
      setSelectedPaciente(response.data);
      setShowModal(true);
    } catch (error) {
      toast.error('Erro ao carregar detalhes do paciente');
    } finally {
      setLoadingModal(false);
    }
  };

  const filteredPacientes = pacientes.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf?.includes(searchTerm) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pacientesBloqueados = pacientes.filter(p => p.bloqueado);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const statusLabels = {
    agendada: 'Agendada',
    concluida: 'Concluída',
    cancelada: 'Cancelada',
    remarcada: 'Remarcada',
    falta: 'Falta'
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciar Pacientes</h1>
        <p className="text-gray-600 mt-1">Visualize e gerencie os pacientes da clínica</p>
      </div>

      {/* Alerta de pacientes bloqueados */}
      {pacientesBloqueados.length > 0 && !filtroBloquados && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
          <div className="flex-1">
            <p className="font-medium text-yellow-800">
              {pacientesBloqueados.length} paciente(s) bloqueado(s) aguardando liberação
            </p>
            <p className="text-sm text-yellow-600">
              Pacientes são bloqueados automaticamente após 3 faltas consecutivas
            </p>
          </div>
          <button
            onClick={() => setFiltroBloqueados(true)}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Ver bloqueados
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroBloqueados(false)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !filtroBloquados 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos ({pacientes.length})
            </button>
            <button
              onClick={() => setFiltroBloqueados(true)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                filtroBloquados 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <LockClosedIcon className="w-4 h-4" />
              Bloqueados ({pacientesBloqueados.length})
            </button>
          </div>
        </div>
      </div>

      {/* Lista de pacientes */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Paciente</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">CPF</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Convênio</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Faltas</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPacientes.map((paciente) => (
              <tr key={paciente.id} className={`hover:bg-gray-50 ${paciente.bloqueado ? 'bg-red-50' : ''}`}>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-800">{paciente.nome}</p>
                    <p className="text-sm text-gray-500">{paciente.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{paciente.cpf}</td>
                <td className="px-6 py-4 text-gray-600">
                  {paciente.convenio_nome || 'Particular'}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    paciente.faltas_consecutivas >= 3 
                      ? 'bg-red-100 text-red-800'
                      : paciente.faltas_consecutivas > 0
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {paciente.faltas_consecutivas || 0}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {paciente.bloqueado ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      <LockClosedIcon className="w-3 h-3" />
                      Bloqueado
                    </span>
                  ) : paciente.ativo ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Ativo
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                      Inativo
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => loadPacienteDetails(paciente.id)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Ver detalhes"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    {paciente.bloqueado ? (
                      <button
                        onClick={() => handleDesbloquear(paciente.id)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Desbloquear"
                      >
                        <LockOpenIcon className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBloquear(paciente.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Bloquear"
                      >
                        <LockClosedIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPacientes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {filtroBloquados 
              ? 'Nenhum paciente bloqueado' 
              : 'Nenhum paciente encontrado'
            }
          </div>
        )}
      </div>

      {/* Modal de detalhes */}
      {showModal && selectedPaciente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">
                Detalhes do Paciente
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {loadingModal ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="p-6">
                {/* Info do paciente */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Nome</p>
                    <p className="font-medium text-gray-800">{selectedPaciente.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">CPF</p>
                    <p className="font-medium text-gray-800">{selectedPaciente.cpf}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">E-mail</p>
                    <p className="font-medium text-gray-800">{selectedPaciente.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Telefone</p>
                    <p className="font-medium text-gray-800">{selectedPaciente.telefone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Convênio</p>
                    <p className="font-medium text-gray-800">{selectedPaciente.convenio_nome || 'Particular'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium">
                      {selectedPaciente.bloqueado ? (
                        <span className="text-red-600">Bloqueado</span>
                      ) : (
                        <span className="text-green-600">Ativo</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedPaciente.estatisticas?.total_consultas || 0}
                    </p>
                    <p className="text-sm text-blue-600">Total</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {selectedPaciente.estatisticas?.compareceu || 0}
                    </p>
                    <p className="text-sm text-green-600">Compareceu</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {selectedPaciente.estatisticas?.faltou || 0}
                    </p>
                    <p className="text-sm text-red-600">Faltas</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {selectedPaciente.estatisticas?.cancelou || 0}
                    </p>
                    <p className="text-sm text-yellow-600">Cancelou</p>
                  </div>
                </div>

                {/* Alerta de faltas */}
                {selectedPaciente.faltas_consecutivas > 0 && (
                  <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                    selectedPaciente.bloqueado 
                      ? 'bg-red-50 border border-red-200' 
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <ExclamationTriangleIcon className={`w-6 h-6 ${
                      selectedPaciente.bloqueado ? 'text-red-600' : 'text-yellow-600'
                    }`} />
                    <div className="flex-1">
                      <p className={`font-medium ${
                        selectedPaciente.bloqueado ? 'text-red-800' : 'text-yellow-800'
                      }`}>
                        {selectedPaciente.faltas_consecutivas} falta(s) consecutiva(s)
                      </p>
                      <p className={`text-sm ${
                        selectedPaciente.bloqueado ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {selectedPaciente.bloqueado 
                          ? 'Paciente bloqueado automaticamente pelo sistema'
                          : `Mais ${3 - selectedPaciente.faltas_consecutivas} falta(s) e será bloqueado`
                        }
                      </p>
                    </div>
                    {selectedPaciente.bloqueado && (
                      <button
                        onClick={() => handleDesbloquear(selectedPaciente.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <LockOpenIcon className="w-4 h-4" />
                        Desbloquear
                      </button>
                    )}
                  </div>
                )}

                {/* Histórico de consultas */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Últimas Consultas</h3>
                  {selectedPaciente.consultas?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPaciente.consultas.map((consulta, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-800">
                              {format(new Date(consulta.data_consulta), 'dd/MM/yyyy')} às {consulta.hora_consulta?.substring(0,5)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {consulta.medico_nome} - {consulta.especialidade}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            consulta.status === 'concluida' ? 'bg-green-100 text-green-800' :
                            consulta.status === 'falta' ? 'bg-red-100 text-red-800' :
                            consulta.status === 'cancelada' ? 'bg-gray-100 text-gray-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {statusLabels[consulta.status] || consulta.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Nenhuma consulta registrada</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
