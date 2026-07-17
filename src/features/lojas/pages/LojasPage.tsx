import React, { useState, useEffect } from 'react';
import { Store, Plus, MapPin, Search, Edit2, Box, MonitorSmartphone, X } from 'lucide-react';
import { getLojas, createLoja, updateLoja } from '@/features/lojas';
import { getAllCaixas, removerCaixa } from '@/features/vendas';
import { getUsers } from '@/features/users';
import toast from 'react-hot-toast';
import { LojaDetailsModal } from '../components/LojaDetailsModal';

export function LojasPage() {
  const [activeTab, setActiveTab] = useState<'LOJAS' | 'CAIXAS'>('LOJAS');
  
  const [lojas, setLojas] = useState<any[]>([]);
  const [caixas, setCaixas] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateCaixaModal, setShowCreateCaixaModal] = useState(false);
  
  const [newLoja, setNewLoja] = useState({ nome: '', endereco: '', cidade: '', gestorId: '' });
  const [editingLoja, setEditingLoja] = useState({ id: '', nome: '', endereco: '', cidade: '', gestorId: '' });
  const [newCaixa, setNewCaixa] = useState({ nome: '', lojaId: '' });
  
  const [selectedLoja, setSelectedLoja] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [lojasData, usersData, caixasData] = await Promise.all([
        getLojas(),
        getUsers(), // Assumes getUsers() is exported from users.api.ts
        getAllCaixas()
      ]);
      setLojas(lojasData);
      setCaixas(caixasData);
      setUsers(usersData.filter((u: any) => u.role === 'MANAGER' || u.role === 'ADMIN'));
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLoja(newLoja);
      toast.success('Loja criada com sucesso');
      setShowCreateModal(false);
      setNewLoja({ nome: '', endereco: '', cidade: '', gestorId: '' });
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar loja');
    }
  };

  const handleCreateCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaixa.lojaId) return toast.error('Selecione uma loja para o caixa.');
    try {
      // Assuming criarCaixa is imported from @/api/caixas.api
      const { criarCaixa } = await import('@/features/vendas');
      await criarCaixa(newCaixa);
      toast.success('Caixa criado com sucesso!');
      setShowCreateCaixaModal(false);
      setNewCaixa({ nome: '', lojaId: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar caixa.');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateLoja(editingLoja.id, {
        nome: editingLoja.nome,
        endereco: editingLoja.endereco,
        cidade: editingLoja.cidade,
        gestorId: editingLoja.gestorId
      });
      toast.success('Loja atualizada com sucesso');
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar loja');
    }
  };

  const openEditModal = (loja: any) => {
    setEditingLoja({
      id: loja.id,
      nome: loja.nome,
      endereco: loja.endereco || '',
      cidade: loja.cidade || '',
      gestorId: loja.gestorId || ''
    });
    setShowEditModal(true);
  };

  const filteredLojas = lojas.filter(loja => 
    loja.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loja.cidade?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCaixas = caixas.filter(caixa => 
    caixa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caixa.loja?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleCaixaStatus = async (caixa: any) => {
    if (!confirm(caixa.isActive ? 'Desativar este caixa?' : 'Reativar este caixa?')) return;
    try {
      if (caixa.isActive) {
        await removerCaixa(caixa.id);
        toast.success('Caixa desativado');
      } else {
        toast.error('Reativação a ser implementada na API'); // Caso precise de um updateCaixa só para estado
      }
      fetchData();
    } catch {
      toast.error('Erro ao alterar estado do caixa');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-blue-600" />
            Lojas & Caixas
          </h1>
          <p className="text-slate-500 mt-1">Gira as lojas fÍsicas, armazéns e terminais de caixa.</p>
        </div>
        
        <div className="flex gap-2">
          {activeTab === 'LOJAS' && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Nova Loja
            </button>
          )}
          {activeTab === 'CAIXAS' && (
            <button 
              onClick={() => setShowCreateCaixaModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Novo Caixa
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('LOJAS')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'LOJAS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Store size={18} /> Gestão de Lojas
        </button>
        <button 
          onClick={() => setActiveTab('CAIXAS')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'CAIXAS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <MonitorSmartphone size={18} /> Terminais de Caixa
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder={activeTab === 'LOJAS' ? "Pesquisar loja..." : "Pesquisar caixa..."} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'LOJAS' ? (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                <th className="px-6 py-4">Nome da Loja</th>
                <th className="px-6 py-4">Localização</th>
                <th className="px-6 py-4">Gestor</th>
                <th className="px-6 py-4">Infraestrutura</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">A carregar lojas...</td>
                </tr>
              ) : filteredLojas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Nenhuma loja encontrada.</td>
                </tr>
              ) : (
                filteredLojas.map(loja => (
                  <tr key={loja.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {loja.nome}
                      {!loja.isActive && <span className="ml-2 px-2 py-0.5 text-[10px] bg-rose-100 text-rose-700 rounded-full">Inativa</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <MapPin size={16} />
                        {loja.cidade || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {loja.gestor ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            {loja.gestor.name.charAt(0)}
                          </div>
                          <span>{loja.gestor.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Sem gestor</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs font-medium" title="Armazéns">
                          <Box size={14} /> {loja.armazens?.length || 0}
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-medium" title="Caixas FÍsicos">
                          <MonitorSmartphone size={14} /> {loja.caixas?.length || 0}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(loja)}
                          className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar Loja"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setSelectedLoja(loja)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          Gerir Infraestrutura
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Terminal (Caixa)</th>
                <th className="px-6 py-4">Loja Associada</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">A carregar caixas...</td>
                </tr>
              ) : filteredCaixas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Nenhum caixa encontrado.</td>
                </tr>
              ) : (
                filteredCaixas.map(caixa => (
                  <tr key={caixa.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {caixa.nome}
                    </td>
                    <td className="px-6 py-4">
                      {caixa.loja?.nome} {caixa.loja?.cidade && `(${caixa.loja.cidade})`}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${caixa.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {caixa.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {caixa.isActive && (
                        <button 
                          onClick={() => handleToggleCaixaStatus(caixa)}
                          className="text-rose-600 hover:text-rose-800 font-medium text-xs px-3 py-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                        >
                          Desativar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* Modal Criar Loja */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Nova Loja</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Loja *</label>
                <input required type="text" value={newLoja.nome} onChange={e => setNewLoja({...newLoja, nome: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ex: Loja Baixa" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                  <input type="text" value={newLoja.cidade} onChange={e => setNewLoja({...newLoja, cidade: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                  <input type="text" value={newLoja.endereco} onChange={e => setNewLoja({...newLoja, endereco: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gestor (Opcional)</label>
                <select value={newLoja.gestorId} onChange={e => setNewLoja({...newLoja, gestorId: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Sem Gestor --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Criar Loja</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Loja */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Editar Loja</h2>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Loja *</label>
                <input required type="text" value={editingLoja.nome} onChange={e => setEditingLoja({...editingLoja, nome: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                  <input type="text" value={editingLoja.cidade} onChange={e => setEditingLoja({...editingLoja, cidade: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                  <input type="text" value={editingLoja.endereco} onChange={e => setEditingLoja({...editingLoja, endereco: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gestor Principal</label>
                <select value={editingLoja.gestorId} onChange={e => setEditingLoja({...editingLoja, gestorId: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Sem Gestor --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Atualizar Loja</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gerir Infraestrutura (Caixas / Armazéns) */}
      {selectedLoja && (
        <LojaDetailsModal 
          loja={selectedLoja} 
          users={users}
          onClose={() => setSelectedLoja(null)} 
          onUpdate={fetchData} 
        />
      )}
      {/* Modal Adicionar Caixa */}
      {showCreateCaixaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Adicionar Novo Caixa</h2>
              <button onClick={() => setShowCreateCaixaModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCaixa} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Caixa *</label>
                <input 
                  type="text" 
                  required 
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Ex: Caixa Principal, Caixa 01"
                  value={newCaixa.nome}
                  onChange={e => setNewCaixa({...newCaixa, nome: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loja Associada *</label>
                <select 
                  required
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newCaixa.lojaId}
                  onChange={e => setNewCaixa({...newCaixa, lojaId: e.target.value})}
                >
                  <option value="">Selecione uma loja...</option>
                  {lojas.map(loja => (
                    <option key={loja.id} value={loja.id}>{loja.nome}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowCreateCaixaModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
