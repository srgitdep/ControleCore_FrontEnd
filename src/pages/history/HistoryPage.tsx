import { useAuth } from '@/hooks/useAuth';
import { AuditLogTable } from './components/AuditLogTable';
import { History } from 'lucide-react';

export function HistoryPage() {
  const { user } = useAuth();
  
  // Se for nível gerencial ou superior, vamos não enviar userId por padrão para carregar o histórico global
  // Caso contrário, enviamos o próprio id (embora o backend já faça este enforce de segurança)
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
            {isManagerial ? 'Histórico Global do Sistema' : 'Meu Histórico no Sistema'}
          </h1>
          <p className="text-sm text-slate-500">
            {isManagerial 
              ? 'Visualize as ações de todos os utilizadores da empresa.' 
              : 'Visualize o registo das suas ações no sistema.'}
          </p>
        </div>
      </div>

      <AuditLogTable userId={targetUserId} />
    </div>
  );
}
