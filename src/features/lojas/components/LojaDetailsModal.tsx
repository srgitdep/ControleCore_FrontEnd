import React, { useState } from 'react';
import { X, Box, MonitorSmartphone, Plus, Trash2, CheckCircle2, User, Loader2 } from 'lucide-react';
import { criarCaixa, removerCaixa } from '@/features/vendas';
import { createArmazem, deleteArmazem, updateLoja } from '@/features/lojas';
import toast from 'react-hot-toast';

export function LojaDetailsModal({ loja, users, onClose, onUpdate }: { loja: any; users: any[]; onClose: () => void; onUpdate: () => void }) {
  const [activeTab, setActiveTab] = useState<'INFO' | 'ARMAZENS' | 'CAIXAS'>('CAIXAS');
  
  // States para novos
  const [novoCaixa, setNovoCaixa] = useState('');
  const [novoArmazem, setNovoArmazem] = useState('');
  const [gestorId, setGestorId] = useState(loja.gestorId || '');
  const [isSavingGestor, setIsSavingGestor] = useState(false);
  const [isCreatingCaixa, setIsCreatingCaixa] = useState(false);

  const handleCreateCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoCaixa.trim()) return;
    setIsCreatingCaixa(true);
    try {
      await criarCaixa({ lojaId: loja.id, nome: novoCaixa });
      toast.success('Caixa adicionado');
      setNovoCaixa('');
      onUpdate();
    } catch {
      toast.error('Erro ao adicionar caixa');
    } finally {
      setIsCreatingCaixa(false);
    }
  };

  const handleCreateArmazem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoArmazem.trim()) return;
    try {
      await createArmazem({ lojaId: loja.id, nome: novoArmazem, tipo: 'Venda' });
      toast.success('Armazém adicionado');
      setNovoArmazem('');
      onUpdate();
    } catch {
      toast.error('Erro ao adicionar armazém');
    }
  };

  const handleDeleteCaixa = async (id: string) => {
    if (!confirm('Desativar este terminal de caixa?')) return;
    try {
      await removerCaixa(id);
      toast.success('Caixa removido');
      onUpdate();
    } catch {
      toast.error('Erro ao remover caixa');
    }
  };

  const handleDeleteArmazem = async (id: string) => {
    if (!confirm('Apagar armazém?')) return;
    try {
      await deleteArmazem(id);
      toast.success('Armazém removido');
      onUpdate();
    } catch {
      toast.error('Erro ao remover armazém');
    }
  };

  const handleUpdateGestor = async () => {
    setIsSavingGestor(true);
    try {
      await updateLoja(loja.id, { gestorId });
      toast.success('Gestor atualizado');
      onUpdate();
    } catch {
      toast.error('Erro ao atualizar gestor');
    } finally {
      setIsSavingGestor(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{loja.nome}</h2>
            <p className="text-sm text-slate-500">Gestão de Infraestrutura e Pessoal</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('CAIXAS')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'CAIXAS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <MonitorSmartphone size={16} /> Caixas (Terminais)
          </button>
          <button 
            onClick={() => setActiveTab('ARMAZENS')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'ARMAZENS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Box size={16} /> Armazéns
          </button>
          <button 
            onClick={() => setActiveTab('INFO')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'INFO' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <User size={16} /> Gestor Principal
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
          
          {activeTab === 'CAIXAS' && (
            <div className="space-y-6">
              <form onSubmit={handleCreateCaixa} className="flex gap-3">
                <input 
                  type="text" 
                  value={novoCaixa}
                  onChange={e => setNovoCaixa(e.target.value)}
                  placeholder="Ex: Caixa 01 (Balcão Principal)" 
                  className="flex-1 px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                <button type="submit" disabled={!novoCaixa.trim() || isCreatingCaixa} className="px-5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm">
                  {isCreatingCaixa ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Adicionar
                </button>
              </form>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                {loja.caixas?.length > 0 ? (
                  <ul className="divide-y divide-slate-100">
                    {loja.caixas.map((c: any) => (
                      <li key={c.id} className={`flex items-center justify-between p-4 ${!c.isActive && 'opacity-50'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${c.isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                            <MonitorSmartphone size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 flex items-center gap-2">
                              {c.nome}
                              {!c.isActive && <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase font-bold">Inativo</span>}
                            </p>
                          </div>
                        </div>
                        {c.isActive && (
                          <button onClick={() => handleDeleteCaixa(c.id)} className="text-slate-400 hover:text-rose-500 p-2 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <MonitorSmartphone className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p>Nenhum caixa registado nesta loja.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ARMAZENS' && (
            <div className="space-y-6">
              <form onSubmit={handleCreateArmazem} className="flex gap-3">
                <input 
                  type="text" 
                  value={novoArmazem}
                  onChange={e => setNovoArmazem(e.target.value)}
                  placeholder="Ex: Armazém Retaguarda" 
                  className="flex-1 px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                <button type="submit" disabled={!novoArmazem.trim()} className="px-5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-sm">
                  <Plus size={18} /> Adicionar
                </button>
              </form>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                {loja.armazens?.length > 0 ? (
                  <ul className="divide-y divide-slate-100">
                    {loja.armazens.map((a: any) => (
                      <li key={a.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                            <Box size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{a.nome}</p>
                            <p className="text-xs text-slate-500">Tipo: {a.tipo}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteArmazem(a.id)} className="text-slate-400 hover:text-rose-500 p-2 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <Box className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p>Nenhum armazém registado nesta loja.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'INFO' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Responsável / Gestor de Loja</label>
                <select 
                  value={gestorId} 
                  onChange={e => setGestorId(e.target.value)} 
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Sem Gestor --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
                <p className="text-xs text-slate-500 mt-2">Apenas utilizadores com o nÍvel ADMIN ou MANAGER podem ser gestores de loja.</p>
              </div>
              <div className="flex justify-end pt-2">
                <button 
                  onClick={handleUpdateGestor}
                  disabled={isSavingGestor || gestorId === (loja.gestorId || '')}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle2 size={18} /> Guardar Gestor
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
