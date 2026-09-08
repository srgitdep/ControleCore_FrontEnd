import { useAuth } from '@/features/auth';
import { AuditLogTable } from '../components/AuditLogTable';
import { History } from 'lucide-react';

export function HistoryPage() {
  const { user } = useAuth();
  
  // Se for nÍvel gerencial ou superior, vamos não enviar userId por padrão para carregar o histórico global
  // Caso contrário, enviamos o próprio id (embora o backend já faça este enforce de segurança)
  const isManagerial = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role || '');
  const targetUserId = isManagerial ? undefined : user?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <History size={24} />
        </div>
        {/* Aqui o título dizia mais do que o nome da página: distinguia o histórico
            global do pessoal, e o cabeçalho da aplicação diz só «Histórico no
            Sistema». A distinção fica — é ela que muda o que se está a ver. */}
        <p className="text-sm text-slate-500">
          {isManagerial
            ? 'Acções de todos os utilizadores da empresa.'
            : 'As suas acções no sistema.'}
        </p>
      </div>

      <AuditLogTable userId={targetUserId} />
    </div>
  );
}
