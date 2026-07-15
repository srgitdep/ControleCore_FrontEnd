import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { getAuditLogs } from '@/api/auditoria.api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AuditAction } from '@/types/auditoria.types';
import { format } from 'date-fns';

interface AuditLogTableProps {
  userId?: string;
}

const ACTION_COLORS: Record<AuditAction, { bg: string; text: string; border: string }> = {
  CREATE: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  UPDATE: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  DELETE: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  LOGIN: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  LOGOUT: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  SALE_COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  SALE_CANCELLED: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' },
};

const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: 'Criação',
  UPDATE: 'Atualização',
  DELETE: 'Remoção',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  SALE_COMPLETED: 'Venda Concluída',
  SALE_CANCELLED: 'Venda Cancelada',
};

export function AuditLogTable({ userId }: AuditLogTableProps) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['auditLogs', userId],
    queryFn: () => getAuditLogs({ userId }),
  });

  const exportToPDF = () => {
    if (!logs || logs.length === 0) {
      toast.error('Sem dados para exportar.');
      return;
    }
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Histórico no Sistema', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleString('pt-PT');
    doc.text(`Gerado a: ${dateStr}`, 14, 28);
    
    autoTable(doc, {
      startY: 35,
      head: [['Utilizador', 'Ação', 'Detalhes', 'Data & Hora', 'Perfil']],
      body: logs.map(l => [
        l.user ? l.user.name : 'Sistema / Desconhecido',
        ACTION_LABELS[l.action] || l.action,
        l.entityName && l.entityName !== 'Auth' ? `${l.entityName}: ${l.newValues?.nome || l.newValues?.name || l.newValues?.numeroFatura || l.newValues?.email || l.newValues?.titulo || l.entityId}` : '-',
        format(new Date(l.createdAt), 'dd MMM, yyyy HH:mm:ss'),
        l.user ? `${l.user.perfil?.nome || 'Padrão'}\n(${l.user.role || 'USER'})` : '-'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }, // emerald-500
    });
    
    doc.save(`historico_sistema_${Date.now()}.pdf`);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Registos de Auditoria
        </h2>
        <button 
          onClick={exportToPDF}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Download size={16} />
          <span>Exportar PDF</span>
        </button>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs">
              <tr>
                <th className="px-4 py-4">Utilizador</th>
                <th className="px-4 py-4">Ação</th>
                <th className="px-4 py-4">Detalhes</th>
                <th className="px-4 py-4">Data & Hora</th>
                <th className="px-4 py-4">Perfil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs?.map((log) => {
                const color = ACTION_COLORS[log.action] || ACTION_COLORS.LOGOUT;
                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-4">
                      {log.user ? (
                        <div>
                          <p className="text-slate-900 font-medium">{log.user.name}</p>
                          <p className="text-slate-500 text-xs">{log.user.email}</p>
                        </div>
                      ) : (
                        <p className="text-slate-500 italic">Desconhecido</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${color.bg} ${color.text} ${color.border}`}>
                        <div className={`w-1.5 h-1.5 rounded-full bg-current opacity-75`} />
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {log.entityName && log.entityName !== 'Auth' ? (
                        <div>
                          <p className="text-slate-900 text-sm font-semibold">{log.entityName}</p>
                          <p className="text-slate-500 text-xs max-w-[200px] truncate" title={log.newValues?.nome || log.newValues?.name || log.newValues?.numeroFatura || log.newValues?.email || log.newValues?.titulo || log.entityId}>
                            {log.newValues?.nome || log.newValues?.name || log.newValues?.numeroFatura || log.newValues?.email || log.newValues?.titulo || log.entityId}
                          </p>
                        </div>
                      ) : (
                        <p className="text-slate-500 text-xs italic">-</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <div>
                        <p className="font-medium text-slate-700">{format(new Date(log.createdAt), 'dd MMM, yyyy')}</p>
                        <p className="text-slate-500 text-xs">{format(new Date(log.createdAt), 'HH:mm:ss')}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {log.user ? (
                        <div>
                          <p className="font-medium text-slate-900">{log.user.perfil?.nome || 'Padrão'}</p>
                          <p className="text-slate-500 text-xs font-semibold">{log.user.role || 'USER'}</p>
                        </div>
                      ) : (
                        <p className="text-slate-500 italic">-</p>
                      )}
                    </td>
                  </tr>
                );
              })}
              {logs?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Nenhum registo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
