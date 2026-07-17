import { X } from 'lucide-react';
import type { UserDetail } from '@/features/users';
import { AuditLogTable } from '../../history/components/AuditLogTable';

interface UserAuditLogModalProps {
  user: UserDetail;
  onClose: () => void;
}

export function UserAuditLogModal({ user, onClose }: UserAuditLogModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Histórico de Auditoria</h2>
            <p className="text-sm text-slate-500 mt-1">
              Visualizando logs de <span className="font-medium text-slate-700">{user.name}</span> ({user.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar">
          <AuditLogTable userId={user.id} />
        </div>
      </div>
    </div>
  );
}
