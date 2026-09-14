import { ClipboardList, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';
import { useDashboardInventario } from '@/features/stock';
import type { InventoryCycleStatus } from '@/features/stock';

const STATUS_LABEL: Record<InventoryCycleStatus, string> = {
  RASCUNHO: 'Rascunho',
  PREPARADO: 'Preparado',
  EM_CONTAGEM: 'Em Contagem',
  PAUSADO: 'Pausado',
  VALIDACAO_DE_COBERTURA: 'A validar cobertura',
  EM_RECONCILIACAO: 'Em Reconciliação',
  AGUARDA_RECONTAGEM: 'Aguarda Recontagem',
  EM_ANALISE_MAYRA: 'Em Análise (MAYRA)',
  AGUARDA_APROVACAO: 'Aguarda Aprovação',
  AJUSTE_APROVADO: 'Ajuste Aprovado',
  ENCERRADO: 'Encerrado',
  CANCELADO: 'Cancelado',
  BLOQUEADO_POR_ERRO: 'Bloqueado por Erro',
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-PT', { style: 'currency', currency: 'MZN', maximumFractionDigits: 0 });
}

/**
 * Visão geral da empresa (§12): quantos ciclos estão ativos, quantas
 * exceções aguardam decisão do Gestor e o impacto financeiro acumulado —
 * o que um Gestor quer ver antes de entrar em qualquer ciclo específico.
 */
export function DashboardInventario({ onSelectCycle }: { onSelectCycle: (cycleId: string) => void }) {
  const { data, isLoading } = useDashboardInventario();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  const totalEncerrado = data.ciclosPorStatus.find((c) => c.status === 'ENCERRADO')?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-slate-400">
            <ClipboardList className="h-4 w-4" />
            <p className="text-[11px]">Ciclos ativos</p>
          </div>
          <p className="mt-1 text-xl font-bold text-slate-800">{data.ciclosAtivos}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
          <div className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-[11px]">Exceções pendentes</p>
          </div>
          <p className="mt-1 text-xl font-bold text-amber-700">{data.excecoes.pendentes}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 className="h-4 w-4" />
            <p className="text-[11px]">Exceções decididas</p>
          </div>
          <p className="mt-1 text-xl font-bold text-emerald-700">{data.excecoes.decididas}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3">
          <div className="flex items-center gap-2 text-rose-500">
            <TrendingDown className="h-4 w-4" />
            <p className="text-[11px]">Impacto pendente</p>
          </div>
          <p className="mt-1 text-xl font-bold text-rose-700">{formatarMoeda(data.excecoes.impactoPendente)}</p>
        </div>
      </div>

      {data.ultimosCiclos.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
          <div className="border-b border-slate-100 px-4 py-2">
            <p className="text-xs font-semibold text-slate-500">Ciclos recentes</p>
          </div>
          <div className="divide-y divide-slate-50">
            {data.ultimosCiclos.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectCycle(c.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{c.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {STATUS_LABEL[c.status]} · {c.totalItens} item(ns)
                    {c.totalExcecoes > 0 && ` · ${c.totalExcecoes} exceção(ões)`}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-slate-400">
                  {new Date(c.createdAt).toLocaleDateString('pt-PT')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {totalEncerrado > 0 && (
        <p className="text-[11px] text-slate-400">
          {totalEncerrado} ciclo(s) encerrado(s) · Impacto total decidido: {formatarMoeda(data.excecoes.impactoDecidido)}
        </p>
      )}
    </div>
  );
}
