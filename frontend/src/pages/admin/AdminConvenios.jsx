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

export default function AdminConvenios() {
  const [convenios, setConvenios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConvenio, setEditingConvenio] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    codigo: ''
  });

  useEffect(() => {
    loadConvenios();
  }, []);

  const loadConvenios = async () => {
    try {
      const response = await adminApi.get('/convenios');
      setConvenios(response.data);
    } catch (error) {
      toast.error('Erro ao carregar convênios');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (convenio = null) => {
    if (convenio) {
      setEditingConvenio(convenio);
      setFormData({
        nome: convenio.nome,
        codigo: convenio.codigo || ''
      });
    } else {
      setEditingConvenio(null);
      setFormData({
        nome: '',
        codigo: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingConvenio(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingConvenio) {
        await adminApi.put(`/convenios/${editingConvenio.id}`, formData);
        toast.success('Convênio atualizado com sucesso!');
      } else {
        await adminApi.post('/convenios', formData);
        toast.success('Convênio cadastrado com sucesso!');
      }
      
      handleCloseModal();
      loadConvenios();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar convênio');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente desativar este convênio?')) return;
    
    try {
      await adminApi.delete(`/convenios/${id}`);
      toast.success('Convênio desativado com sucesso!');
      loadConvenios();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao desativar convênio');
    }
  };

  const handleToggleStatus = async (convenio) => {
    try {
      await adminApi.put(`/convenios/${convenio.id}`, { ativo: !convenio.ativo });
      toast.success(`Convênio ${convenio.ativo ? 'desativado' : 'ativado'} com sucesso!`);
      loadConvenios();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const filteredConvenios = convenios.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-800">Gerenciar Convênios</h1>
          <p className="text-gray-600 mt-1">Administre os planos de saúde aceitos</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Novo Convênio
        </button>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar convênio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Lista de convênios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredConvenios.map((convenio) => (
          <div 
            key={convenio.id} 
            className={`bg-white rounded-xl shadow-md p-6 ${!convenio.ativo && 'opacity-60'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{convenio.nome}</h3>
                {convenio.codigo && (
                  <p className="text-gray-500 text-sm mt-1">Código: {convenio.codigo}</p>
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                convenio.ativo 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {convenio.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm">
                <span className="font-medium">{convenio.total_medicos || 0}</span> médico(s) aceitam este convênio
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenModal(convenio)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => handleToggleStatus(convenio)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  convenio.ativo 
                    ? 'text-red-600 bg-red-50 hover:bg-red-100'
                    : 'text-green-600 bg-green-50 hover:bg-green-100'
                }`}
              >
                {convenio.ativo ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredConvenios.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
          Nenhum convênio encontrado
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editingConvenio ? 'Editar Convênio' : 'Novo Convênio'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Nome *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Unimed, Bradesco Saúde..."
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Código</label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: UNIMED, BRADESCO..."
                />
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
                  {editingConvenio ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
