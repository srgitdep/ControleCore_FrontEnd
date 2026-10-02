import { useTranslation } from 'react-i18next';
import { formatData, formatMoedaInteira } from '@/shared/utils';
import { ClipboardList, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';
import { useDashboardInventario } from '@/features/stock';

/**
 * Visão geral da empresa (§12): quantos ciclos estão ativos, quantas
 * exceções aguardam decisão do Gestor e o impacto financeiro acumulado —
 * o que um Gestor quer ver antes de entrar em qualquer ciclo específico.
 */
export function DashboardInventario({ onSelectCycle }: { onSelectCycle: (cycleId: string) => void }) {
  const { t } = useTranslation('stock');
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
            <p className="text-[11px]">{t('dashboard_inv.ciclos_activos')}</p>
          </div>
          <p className="mt-1 text-xl font-bold text-slate-800">{data.ciclosAtivos}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
          <div className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-[11px]">{t('dashboard_inv.excecoes_pendentes')}</p>
          </div>
          <p className="mt-1 text-xl font-bold text-amber-700">{data.excecoes.pendentes}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 className="h-4 w-4" />
            <p className="text-[11px]">{t('dashboard_inv.excecoes_decididas')}</p>
          </div>
          <p className="mt-1 text-xl font-bold text-emerald-700">{data.excecoes.decididas}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3">
          <div className="flex items-center gap-2 text-rose-500">
            <TrendingDown className="h-4 w-4" />
            <p className="text-[11px]">{t('dashboard_inv.impacto_pendente')}</p>
          </div>
          <p className="mt-1 text-xl font-bold text-rose-700">{formatMoedaInteira(data.excecoes.impactoPendente)}</p>
        </div>
      </div>

      {data.ultimosCiclos.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
          <div className="border-b border-slate-100 px-4 py-2">
            <p className="text-xs font-semibold text-slate-500">{t('dashboard_inv.ciclos_recentes')}</p>
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
                    {t(`ciclo_estado.${c.status}`)} · {t('dashboard_inv.itens', { n: c.totalItens })}
                    {c.totalExcecoes > 0 && ` · ${t('dashboard_inv.excecoes', { n: c.totalExcecoes })}`}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-slate-400">
                  {formatData(c.createdAt)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {totalEncerrado > 0 && (
        <p className="text-[11px] text-slate-400">
          {t('dashboard_inv.encerrados', { n: totalEncerrado, impacto: formatMoedaInteira(data.excecoes.impactoDecidido) })}
        </p>
      )}
    </div>
  );
}
