import { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import { toast } from 'react-toastify';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function AdminMedicos() {
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMedico, setEditingMedico] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    crm: '',
    email: '',
    telefone: '',
    senha: '',
    especialidade_id: '',
    convenio_ids: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [medicosRes, especialidadesRes, conveniosRes] = await Promise.all([
        adminApi.get('/medicos'),
        adminApi.get('/especialidades'),
        adminApi.get('/convenios-lista')
      ]);
      setMedicos(medicosRes.data);
      setEspecialidades(especialidadesRes.data);
      setConvenios(conveniosRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (medico = null) => {
    if (medico) {
      setEditingMedico(medico);
      setFormData({
        nome: medico.nome,
        crm: medico.crm,
        email: medico.email,
        telefone: medico.telefone || '',
        senha: '',
        especialidade_id: medico.especialidade_id,
        convenio_ids: medico.convenios?.map(c => c.id) || []
      });
    } else {
      setEditingMedico(null);
      setFormData({
        nome: '',
        crm: '',
        email: '',
        telefone: '',
        senha: '',
        especialidade_id: '',
        convenio_ids: []
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMedico(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingMedico) {
        const updateData = { ...formData };
        if (!updateData.senha) delete updateData.senha;
        
        await adminApi.put(`/medicos/${editingMedico.id}`, updateData);
        toast.success('Médico atualizado com sucesso!');
      } else {
        await adminApi.post('/medicos', formData);
        toast.success('Médico cadastrado com sucesso!');
      }
      
      handleCloseModal();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar médico');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente desativar este médico?')) return;
    
    try {
      await adminApi.delete(`/medicos/${id}`);
      toast.success('Médico desativado com sucesso!');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao desativar médico');
    }
  };

  const handleToggleConvenio = (convenioId) => {
    setFormData(prev => ({
      ...prev,
      convenio_ids: prev.convenio_ids.includes(convenioId)
        ? prev.convenio_ids.filter(id => id !== convenioId)
        : [...prev.convenio_ids, convenioId]
    }));
  };

  const filteredMedicos = medicos.filter(m => 
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.crm.includes(searchTerm) ||
    m.especialidade_nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gerenciar Médicos</h1>
          <p className="text-gray-600 mt-1">Cadastre e gerencie os médicos da clínica</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Novo Médico
        </button>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, CRM ou especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Lista de médicos */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Nome</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">CRM</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Especialidade</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Convênios</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredMedicos.map((medico) => (
              <tr key={medico.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-800">{medico.nome}</p>
                    <p className="text-sm text-gray-500">{medico.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{medico.crm}</td>
                <td className="px-6 py-4 text-gray-600">{medico.especialidade_nome}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {medico.convenios?.slice(0, 2).map(conv => (
                      <span 
                        key={conv.id}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {conv.nome}
                      </span>
                    ))}
                    {medico.convenios?.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{medico.convenios.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    medico.ativo 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {medico.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleOpenModal(medico)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    {medico.ativo && (
                      <button
                        onClick={() => handleDelete(medico.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Desativar"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredMedicos.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nenhum médico encontrado
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editingMedico ? 'Editar Médico' : 'Novo Médico'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Nome *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">CRM *</label>
                  <input
                    type="text"
                    value={formData.crm}
                    onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">E-mail *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    {editingMedico ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}
                  </label>
                  <input
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required={!editingMedico}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Especialidade *</label>
                  <select
                    value={formData.especialidade_id}
                    onChange={(e) => setFormData({ ...formData, especialidade_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Selecione...</option>
                    {especialidades.map(esp => (
                      <option key={esp.id} value={esp.id}>{esp.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Convênios Aceitos</label>
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg">
                  {convenios.map(conv => (
                    <label key={conv.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.convenio_ids.includes(conv.id)}
                        onChange={() => handleToggleConvenio(conv.id)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{conv.nome}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {editingMedico ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
