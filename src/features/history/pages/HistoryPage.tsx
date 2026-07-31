import { useState } from 'react';
import { useAuth } from '@/features/auth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AuditLogTable } from '../components/AuditLogTable';
import { History, ShieldCheck, GitBranch } from 'lucide-react';
import {
  getAuditTimeline,
  validarCadeiaAuditoria,
} from '../api/auditoria.api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function HistoryPage() {
  const { user } = useAuth();
  const isManagerial = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role || '');
  const targetUserId = isManagerial ? undefined : user?.id;

  const [entidade, setEntidade] = useState('User');
  const [entidadeId, setEntidadeId] = useState('');
  const [buscarTimeline, setBuscarTimeline] = useState(false);

  const timelineQuery = useQuery({
    queryKey: ['auditTimeline', entidade, entidadeId],
    queryFn: () => getAuditTimeline(entidade, entidadeId),
    enabled: buscarTimeline && !!entidade && !!entidadeId,
  });

  const validarMutation = useMutation({
    mutationFn: validarCadeiaAuditoria,
    onSuccess: (r) => {
      if (r.ok) {
        toast.success(
          `Cadeia íntegra · ${r.validos} válidos` +
            (r.legados ? ` · ${r.legados} legados` : ''),
        );
      } else {
        toast.error(`Cadeia com ${r.invalidos.length} problema(s)`);
      }
    },
    onError: () => toast.error('Falha ao validar a cadeia de auditoria'),
  });

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
            Livro único de auditoria com cadeia de hash verificável.
          </p>
        </div>
      </div>

      {isManagerial && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <GitBranch size={18} />
              Timeline por entidade
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                className="border border-slate-200 rounded-md px-3 py-2 text-sm"
                placeholder="Entidade (ex: User)"
                value={entidade}
                onChange={(e) => {
                  setBuscarTimeline(false);
                  setEntidade(e.target.value);
                }}
              />
              <input
                className="border border-slate-200 rounded-md px-3 py-2 text-sm flex-1 min-w-[160px]"
                placeholder="ID da entidade"
                value={entidadeId}
                onChange={(e) => {
                  setBuscarTimeline(false);
                  setEntidadeId(e.target.value);
                }}
              />
              <button
                type="button"
                className="px-3 py-2 bg-slate-800 text-white rounded-md text-sm"
                onClick={() => setBuscarTimeline(true)}
              >
                Consultar
              </button>
            </div>
            {timelineQuery.isFetching && (
              <p className="text-sm text-slate-500">A carregar…</p>
            )}
            {timelineQuery.data && (
              <ul className="text-sm space-y-2 max-h-48 overflow-auto">
                {timelineQuery.data.length === 0 && (
                  <li className="text-slate-500">Sem eventos para esta entidade.</li>
                )}
                {timelineQuery.data.map((e) => (
                  <li key={e.id} className="border-b border-slate-100 pb-1">
                    <span className="font-medium">#{e.sequencia ?? '—'} {e.action}</span>
                    {' · '}
                    {format(new Date(e.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                    {e.user?.name ? ` · ${e.user.name}` : ''}
                    {e.campos?.length ? ` · [${e.campos.join(', ')}]` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <ShieldCheck size={18} />
              Integridade da cadeia
            </div>
            <p className="text-sm text-slate-500">
              Recalcula SHA-256 e verifica o encadeamento por empresa.
            </p>
            <button
              type="button"
              className="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700"
              disabled={validarMutation.isPending}
              onClick={() => validarMutation.mutate()}
            >
              {validarMutation.isPending ? 'A validar…' : 'Validar cadeia'}
            </button>
            {validarMutation.data && (
              <pre className="text-xs bg-slate-50 border border-slate-100 rounded-md p-3 overflow-auto">
                {JSON.stringify(validarMutation.data, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      <AuditLogTable userId={targetUserId} />
    </div>
  );
}
