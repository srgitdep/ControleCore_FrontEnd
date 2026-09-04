import { useState } from 'react';
import { BarraDaPagina } from '@/shared/ui';

import { Edit2, Trash2, Search, Calendar, Download, SlidersHorizontal, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Ban, CheckCircle2, Palette } from 'lucide-react';
import { useEmpresas, useDeleteEmpresa, useEmpresaStatus } from '@/features/empresas';
import type { Empresa } from '@/features/empresas';
import toast from 'react-hot-toast';
import { EmpresaDialog } from '../components/EmpresaDialog';
import { ConfirmDialog, type PedidoDeMotivo } from '@/shared/ui';
import { EmpresaDetailsModal } from '../components/EmpresaDetailsModal';
import { BrandingModal } from '../components/BrandingModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function EmpresasPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [empresaToEdit, setEmpresaToEdit] = useState<Empresa | null>(null);
  const [empresaToView, setEmpresaToView] = useState<Empresa | null>(null);
  const [empresaToBrand, setEmpresaToBrand] = useState<Empresa | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    /** Recebe o motivo quando o diálogo o pediu. */
    onConfirm: (motivo?: string) => void;
    variant: 'danger' | 'warning' | 'info';
    /** Presente quando a acção exige justificação — a suspensão exige. */
    motivo?: PedidoDeMotivo;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger',
  });

  const closeConfirmDialog = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));

  const { data: empresas, isLoading } = useEmpresas();

  const deleteMutation = useDeleteEmpresa();
  const statusMutation = useEmpresaStatus();

  const filteredEmpresas = empresas?.filter(emp => 
    emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.nuit.includes(searchTerm)
  );

  const exportToPDF = () => {
    if (!filteredEmpresas || filteredEmpresas.length === 0) {
      toast.error('Sem dados para exportar.');
      return;
    }
    const doc = new jsPDF();
    
    // TÍtulo e Data
    doc.setFontSize(16);
    doc.text('Relatório de Empresas', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleString('pt-PT');
    doc.text(`Gerado a: ${dateStr}`, 14, 28);
    
    autoTable(doc, {
      startY: 35,
      head: [['Nome', 'NUIT', 'Email', 'Estado']],
      body: filteredEmpresas.map(emp => [
        emp.nome,
        emp.nuit,
        emp.email,
        emp.isActive ? 'Ativa' : 'Inativa'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    doc.save(`empresas_${Date.now()}.pdf`);
  };

  const handleEdit = (empresa: Empresa) => {
    setEmpresaToEdit(empresa);
    setIsDialogOpen(true);
  };

  /**
   * Suspender ou reactivar.
   *
   * A confirmação pede o motivo quando se suspende: o servidor grava-o no registo de
   * auditoria, e uma suspensão sem motivo é impossível de explicar três meses depois.
   * Reactivar não pede — voltar ao normal não precisa de justificação.
   */
  const handleToggleStatus = (empresa: Empresa) => {
    const suspender = empresa.isActive;

    setConfirmDialog({
      isOpen: true,
      title: suspender ? 'Suspender empresa' : 'Reactivar empresa',
      message: suspender
        ? `Suspender "${empresa.nome}" fecha o acesso a todos os seus utilizadores. Os dados — stock, vendas, histórico — ficam intactos, e a suspensão é reversível.`
        : `Reactivar "${empresa.nome}" devolve o acesso aos seus utilizadores.`,
      variant: suspender ? 'warning' : 'info',
      motivo: suspender
        ? {
            rotulo: 'Porque está a suspender?',
            placeholder: 'Assinatura em atraso desde Julho',
            ajuda: 'Fica no registo de auditoria, com o seu nome e a data.',
          }
        : undefined,
      onConfirm: (motivo?: string) => {
        statusMutation.mutate(
          {
            id: empresa.id,
            action: suspender ? 'DEACTIVATE' : 'ACTIVATE',
            reason: motivo,
          },
          { onSuccess: closeConfirmDialog, onError: closeConfirmDialog },
        );
      },
    });
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Empresa',
      message: 'Tem a certeza que deseja eliminar esta empresa? Esta acção é irreversÍvel e removerá o acesso a todos os utilizadores associados.',
      variant: 'danger',
      onConfirm: () => {
        deleteMutation.mutate(id, {
          onSuccess: closeConfirmDialog,
          onError: closeConfirmDialog
        });
      },
    });
  };

  const openNewDialog = () => {
    setEmpresaToEdit(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* «Lista de Empresas» repetia o «Empresas» do cabeçalho da aplicação. O total
          fica: é dado. */}
      <BarraDaPagina
        resumo={`${filteredEmpresas?.length || 0} ${(filteredEmpresas?.length || 0) === 1 ? 'empresa' : 'empresas'}`}
      />

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Pesquisar empresas..." 
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
              Adicionar Empresa
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

        {/* ── Cartões, em telemóvel ────────────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-2 p-3 sm:hidden">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : (
          <div className="space-y-2 p-3 sm:hidden">
            {filteredEmpresas?.map((empresa) => (
              <div
                key={empresa.id}
                className={`rounded-xl border border-l-[3px] border-slate-200 bg-white p-4 ${
                  empresa.isActive ? 'border-l-emerald-500' : 'border-l-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{empresa.nome}</p>
                    <p className="break-all text-xs text-slate-500">{empresa.email}</p>
                    <p className="mt-1 font-mono text-xs text-slate-400">NUIT {empresa.nuit}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      empresa.isActive
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {empresa.isActive ? 'Ativa' : 'Inativa'}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => { setEmpresaToView(empresa); setIsDetailsOpen(true); }}
                    className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                    aria-label={`Detalhes de ${empresa.nome}`}
                  >
                    <Eye size={17} />
                  </button>
                  <button
                    onClick={() => setEmpresaToBrand(empresa)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-violet-600"
                    aria-label={`Identidade visual de ${empresa.nome}`}
                  >
                    <Palette size={17} />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(empresa)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label={empresa.isActive ? `Suspender ${empresa.nome}` : `Reactivar ${empresa.nome}`}
                  >
                    {empresa.isActive ? <Ban size={17} /> : <CheckCircle2 size={17} />}
                  </button>
                  <button
                    onClick={() => handleEdit(empresa)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                    aria-label={`Editar ${empresa.nome}`}
                  >
                    <Edit2 size={17} />
                  </button>
                  <button
                    onClick={() => handleDelete(empresa.id)}
                    className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Eliminar ${empresa.nome}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}

            {empresas?.length === 0 && (
              <p className="py-12 text-center text-sm text-slate-500">Nenhuma empresa registada.</p>
            )}
          </div>
        )}

        {/* ── Tabela, a partir de sm ──────────────────────────────────────── */}
        <div className="hidden min-h-[400px] overflow-x-auto custom-scrollbar sm:block">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs">
                <tr>
                  <th className="px-4 py-4 w-12 text-center">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  </th>
                  <th className="px-4 py-4 cursor-pointer hover:text-slate-800">
                    <div className="flex items-center gap-2">Nome <SlidersHorizontal size={12} className="opacity-50" /></div>
                  </th>
                  <th className="px-4 py-4 cursor-pointer hover:text-slate-800">
                    <div className="flex items-center gap-2">NUIT <SlidersHorizontal size={12} className="opacity-50" /></div>
                  </th>
                  <th className="px-4 py-4 cursor-pointer hover:text-slate-800">
                    <div className="flex items-center gap-2">Email <SlidersHorizontal size={12} className="opacity-50" /></div>
                  </th>
                  <th className="px-4 py-4 text-right">Estado</th>
                  <th className="px-4 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmpresas?.map((empresa) => (
                  <tr key={empresa.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-4 w-12 text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="px-4 py-4 text-slate-900 font-medium">
                      {empresa.nome}
                    </td>
                    <td className="px-4 py-4 text-slate-500 font-mono text-xs">
                      {empresa.nuit}
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      {empresa.email}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          empresa.isActive
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {empresa.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 transition-opacity">
                        <button
                          onClick={() => { setEmpresaToView(empresa); setIsDetailsOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Detalhes"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => setEmpresaToBrand(empresa)}
                          className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors"
                          title="Identidade visual"
                        >
                          <Palette size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(empresa)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                          title={empresa.isActive ? 'Suspender (reversível)' : 'Reactivar'}
                        >
                          {empresa.isActive ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                        </button>
                        <button
                          onClick={() => handleEdit(empresa)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(empresa.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-30"
                          title="Eliminar (irreversível)"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {empresas?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Nenhuma empresa registada.
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
            <span>0 of {filteredEmpresas?.length || 0} row(s) selected.</span>
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
        <EmpresaDialog
          empresa={empresaToEdit}
          onClose={() => setIsDialogOpen(false)}
        />
      )}

      {isDetailsOpen && empresaToView && (
        <EmpresaDetailsModal
          empresa={empresaToView}
          onClose={() => setIsDetailsOpen(false)}
        />
      )}

      {empresaToBrand && (
        <BrandingModal
          empresa={empresaToBrand}
          onClose={() => setEmpresaToBrand(null)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
        variant={confirmDialog.variant}
        motivo={confirmDialog.motivo}
        isLoading={deleteMutation.isPending || statusMutation.isPending}
      />
    </div>
  );
}
