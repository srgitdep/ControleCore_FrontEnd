import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Trash2, Ban, CheckCircle2, Search, Calendar, Download, SlidersHorizontal, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, History } from 'lucide-react';
import { getUsers, deleteUser, deactivateUser, activateUser } from '@/features/users';
import type { UserDetail } from '@/features/users';
import { ROLE_LABELS } from '@/features/auth';
import toast from 'react-hot-toast';
import { UserDialog } from '../components/UserDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { UserDetailsModal } from '../components/UserDetailsModal';
import { UserAuditLogModal } from '../components/UserAuditLogModal';
import { useAuth } from '@/features/auth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserDetail | null>(null);
  const [userToView, setUserToView] = useState<UserDetail | null>(null);
  const [userToAudit, setUserToAudit] = useState<UserDetail | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'warning',
  });

  const closeConfirmDialog = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success('Utilizador eliminado definitivamente!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeConfirmDialog();
    },
    onError: () => {
      toast.error('Erro ao eliminar o utilizador.');
      closeConfirmDialog();
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateUser(id, { reason: 'Desativado pelo Gestor' }),
    onSuccess: () => {
      toast.success('Utilizador desativado com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeConfirmDialog();
    },
    onError: () => {
      toast.error('Erro ao desativar.');
      closeConfirmDialog();
    }
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateUser(id, { reason: 'Ativado pelo Gestor' }),
    onSuccess: () => {
      toast.success('Utilizador ativado com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeConfirmDialog();
    },
    onError: () => {
      toast.error('Erro ao ativar.');
      closeConfirmDialog();
    }
  });

  const filteredUsers = users?.filter(u => {
    // 1. Regra de Negócio: Esconder SUPER_ADMIN se o utilizador atual não for SUPER_ADMIN
    if (currentUser?.role !== 'SUPER_ADMIN' && u.role === 'SUPER_ADMIN') return false;
    
    // 2. Filtro de pesquisa visual
    const searchLower = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      u.code.toLowerCase().includes(searchLower)
    );
  });

  const exportToPDF = () => {
    if (!filteredUsers || filteredUsers.length === 0) {
      toast.error('Sem dados para exportar.');
      return;
    }
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Relatório de Utilizadores', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleString('pt-PT');
    doc.text(`Gerado a: ${dateStr}`, 14, 28);
    
    autoTable(doc, {
      startY: 35,
      head: [['Código', 'Nome', 'Email', 'Perfil', 'Empresa', 'Estado']],
      body: filteredUsers.map(u => [
        u.code,
        u.name,
        u.email,
        ROLE_LABELS[u.role],
        u.empresa?.nome || 'Global',
        u.isActive ? 'Ativo' : 'Suspenso'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }, // Verde do tailwind (emerald-500)
    });
    
    doc.save(`utilizadores_${Date.now()}.pdf`);
  };

  const handleEdit = (u: UserDetail) => {
    setUserToEdit(u);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Utilizador',
      message: 'Atenção: Eliminar definitivamente este utilizador não pode ser desfeito. Continuar?',
      variant: 'danger',
      onConfirm: () => deleteMutation.mutate(id),
    });
  };

  const handleToggleStatus = (u: UserDetail) => {
    if (u.isActive) {
      setConfirmDialog({
        isOpen: true,
        title: 'Suspender Acesso',
        message: `Pretende suspender o acesso do utilizador ${u.name}? O utilizador será notificado por e-mail.`,
        variant: 'warning',
        onConfirm: () => deactivateMutation.mutate(u.id),
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        title: 'Ativar Acesso',
        message: `Pretende ativar o acesso do utilizador ${u.name}? O utilizador será notificado por e-mail.`,
        variant: 'info',
        onConfirm: () => activateMutation.mutate(u.id),
      });
    }
  };

  const openNewDialog = () => {
    setUserToEdit(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
        Lista de Utilizadores
        <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
          Total: {filteredUsers?.length || 0}
        </span>
      </h1>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Pesquisar utilizadores..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-[280px] transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-md text-sm hover:bg-slate-100 transition-colors">
              <Calendar size={16} />
              <span>Selecionar data</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openNewDialog}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Adicionar Utilizador
            </button>
            <button 
              onClick={exportToPDF}
              className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-md text-sm hover:bg-slate-100 transition-colors"
            >
              <Download size={16} />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs">
                <tr>
                  <th className="px-4 py-4 w-12 text-center">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  </th>
                  <th className="px-4 py-4 cursor-pointer hover:text-slate-800">
                    <div className="flex items-center gap-2">Código <SlidersHorizontal size={12} className="opacity-50" /></div>
                  </th>
                  <th className="px-4 py-4 cursor-pointer hover:text-slate-800">
                    <div className="flex items-center gap-2">Nome <SlidersHorizontal size={12} className="opacity-50" /></div>
                  </th>
                  <th className="px-4 py-4 cursor-pointer hover:text-slate-800">
                    <div className="flex items-center gap-2">Email <SlidersHorizontal size={12} className="opacity-50" /></div>
                  </th>
                  <th className="px-4 py-4 cursor-pointer hover:text-slate-800">
                    <div className="flex items-center gap-2">Perfil <SlidersHorizontal size={12} className="opacity-50" /></div>
                  </th>
                  {currentUser?.role === 'SUPER_ADMIN' && (
                    <th className="px-4 py-4 cursor-pointer hover:text-slate-800">
                      <div className="flex items-center gap-2">Empresa <SlidersHorizontal size={12} className="opacity-50" /></div>
                    </th>
                  )}
                  <th className="px-4 py-4 text-right">Estado</th>
                  <th className="px-4 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers?.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-4 w-12 text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="px-4 py-4 text-slate-500 font-mono text-xs">
                      {u.code}
                    </td>
                    <td className="px-4 py-4 text-slate-900 font-medium">
                      {u.name}
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      {u.email}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-slate-600">
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    {currentUser?.role === 'SUPER_ADMIN' && (
                      <td className="px-4 py-4 text-slate-500">
                        {u.empresa?.nome || <span className="italic opacity-50">Global</span>}
                      </td>
                    )}
                    <td className="px-4 py-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}
                      >
                        {u.isActive ? 'Ativo' : 'Suspenso'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 transition-opacity">
                        <button
                          onClick={() => { setUserToView(u); setIsDetailsOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Detalhes"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => setUserToAudit(u)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title="Histórico no Sistema"
                        >
                          <History size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                          title={u.isActive ? 'Suspender Acesso' : 'Ativar Acesso'}
                          disabled={u.id === currentUser?.id}
                        >
                          {u.isActive ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                        </button>
                        <button
                          onClick={() => handleEdit(u)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-30"
                          title="Eliminar"
                          disabled={u.id === currentUser?.id}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users?.length === 0 && (
                  <tr>
                    <td colSpan={currentUser?.role === 'SUPER_ADMIN' ? 8 : 7} className="px-6 py-12 text-center text-slate-500">
                      Nenhum utilizador registado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer / Pagination */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>0 of {filteredUsers?.length || 0} row(s) selected.</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <select className="bg-white border border-slate-200 rounded px-2 py-1 outline-none text-slate-700">
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
            </div>
            <span>Page 1 of 1</span>
            <div className="flex items-center gap-1">
              <button className="p-1 border border-slate-200 rounded text-slate-400 hover:bg-slate-50 disabled:opacity-50" disabled><ChevronsLeft size={14} /></button>
              <button className="p-1 border border-slate-200 rounded text-slate-400 hover:bg-slate-50 disabled:opacity-50" disabled><ChevronLeft size={14} /></button>
              <button className="p-1 border border-slate-200 rounded text-slate-400 hover:bg-slate-50 disabled:opacity-50" disabled><ChevronRight size={14} /></button>
              <button className="p-1 border border-slate-200 rounded text-slate-400 hover:bg-slate-50 disabled:opacity-50" disabled><ChevronsRight size={14} /></button>
            </div>
          </div>
        </div>

      </div>

      {isDialogOpen && (
        <UserDialog
          userToEdit={userToEdit}
          onClose={() => setIsDialogOpen(false)}
        />
      )}

      {isDetailsOpen && userToView && (
        <UserDetailsModal
          user={userToView}
          onClose={() => setIsDetailsOpen(false)}
        />
      )}

      {userToAudit && (
        <UserAuditLogModal
          user={userToAudit}
          onClose={() => setUserToAudit(null)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
        variant={confirmDialog.variant}
        isLoading={deleteMutation.isPending || deactivateMutation.isPending || activateMutation.isPending}
      />
    </div>
  );
}
