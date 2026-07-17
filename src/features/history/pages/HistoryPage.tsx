import { useAuth } from '@/features/auth';
import { AuditLogTable } from '../components/AuditLogTable';
import { History } from 'lucide-react';

export function HistoryPage() {
  const { user } = useAuth();
  
  // Se for nÃ­vel gerencial ou superior, vamos nÃ£o enviar userId por padrÃ£o para carregar o histÃ³rico global
  // Caso contrÃ¡rio, enviamos o prÃ³prio id (embora o backend jÃ¡ faÃ§a este enforce de seguranÃ§a)
  const isManagerial = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role || '');
  const targetUserId = isManagerial ? undefined : user?.id;

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <History size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {isManagerial ? 'HistÃ³rico Global do Sistema' : 'Meu HistÃ³rico no Sistema'}
          </h1>
          <p className="text-sm text-slate-500">
            {isManagerial 
              ? 'Visualize as aÃ§Ãµes de todos os utilizadores da empresa.' 
              : 'Visualize o registo das suas aÃ§Ãµes no sistema.'}
          </p>
        </div>
      </div>

      <AuditLogTable userId={targetUserId} />
    </div>
  );
}
