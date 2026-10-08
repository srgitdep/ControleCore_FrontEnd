import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Banknote, CheckCircle2, Loader2 } from 'lucide-react';
import { Can } from '@/features/auth';
import { cn, formatDataHora, formatMoeda } from '@/shared/utils';
import { useAcertarContas, useAcertos, useAcertosPendentes } from '../hooks/useOperacao';
import { AcertarDialog } from '../components/AcertarDialog';
import type { AcertoPendente } from '../types/operacao';

/**
 * Quanto cada estafeta deve (US-12) e o fecho das contas (US-11).
 *
 * Só o **numerário** entra aqui: M-Pesa e e-Mola foram para a carteira da loja e não passam pelo
 * bolso do estafeta. Ordenado pelo maior valor em aberto — é quem tem mais dinheiro da loja na rua.
 */
export function AcertosPage() {
  const { t } = useTranslation('entrega');
  const pendentes = useAcertosPendentes();
  const historico = useAcertos();
  const acertar = useAcertarContas();
  const [aAcertar, setAAcertar] = useState<AcertoPendente | null>(null);

  const totalNaRua = (pendentes.data ?? []).reduce((soma, p) => soma + p.valorEmAberto, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Banknote size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('acertos.titulo')}</h1>
            <p className="text-sm text-slate-500">{t('acertos.subtitulo')}</p>
          </div>
        </div>
        {(pendentes.data?.length ?? 0) > 0 && (
          <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
            {t('acertos.total_na_rua')}: <strong>{formatMoeda(totalNaRua)}</strong>
          </p>
        )}
      </header>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">{t('acertos.por_acertar')}</h2>

        {pendentes.isLoading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : pendentes.isError ? (
          <p className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle size={16} />
            {t('acertos.erro')}
          </p>
        ) : (pendentes.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <CheckCircle2 size={28} className="mx-auto text-emerald-400" />
            <p className="mt-3 text-sm text-slate-500">{t('acertos.nada_por_acertar')}</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {(pendentes.data ?? []).map((p) => (
              <li key={p.estafeta.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                    {p.estafeta.nome}
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">{p.estafeta.codigo}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {t('acertos.entregas_pendentes', { count: p.entregasPendentes })}
                    {' · '}
                    {p.ultimoAcertoEm ? t('acertos.ultimo_acerto', { data: formatDataHora(p.ultimoAcertoEm) }) : t('acertos.nunca_acertou')}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <p className="text-xl font-extrabold text-slate-900">{formatMoeda(p.valorEmAberto)}</p>
                  <Can action="manage" resource="acertos_estafeta">
                    <button
                      type="button"
                      onClick={() => setAAcertar(p)}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      {t('acertos.acertar')}
                    </button>
                  </Can>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">{t('acertos.historico')}</h2>

        {historico.isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={18} className="animate-spin text-slate-400" />
          </div>
        ) : historico.isError ? (
          <p className="text-sm text-red-700">{t('acertos.erro_historico')}</p>
        ) : (historico.data ?? []).length === 0 ? (
          <p className="text-sm text-slate-400">{t('acertos.historico_vazio')}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">{t('acertos.col_data')}</th>
                  <th className="px-3 py-2">{t('acertos.col_estafeta')}</th>
                  <th className="px-3 py-2 text-right">{t('acertos.col_devido')}</th>
                  <th className="px-3 py-2 text-right">{t('acertos.col_entregue')}</th>
                  <th className="px-3 py-2">{t('acertos.col_diferenca')}</th>
                  <th className="px-3 py-2">{t('acertos.col_por')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(historico.data ?? []).map((a) => (
                  <tr key={a.id}>
                    <td className="px-3 py-2 text-xs text-slate-500">{formatDataHora(a.createdAt)}</td>
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {a.estafeta.nome} <span className="font-mono text-xs text-slate-400">{a.estafeta.codigo}</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatMoeda(a.totalDevido)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatMoeda(a.totalEntregue)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-semibold',
                          a.estado === 'ACERTADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
                        )}
                        title={a.notas ?? undefined}
                      >
                        {a.estado === 'ACERTADO'
                          ? t('acertos.certo')
                          : `${a.diferenca > 0 ? '+' : '−'}${formatMoeda(Math.abs(a.diferenca))}`}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">{a.acertadoPor.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {aAcertar && (
        <AcertarDialog
          key={aAcertar.estafeta.id}
          pendente={aAcertar}
          aProcessar={acertar.isPending}
          aoFechar={() => setAAcertar(null)}
          aoConfirmar={(corpo) =>
            acertar.mutate({ estafetaId: aAcertar.estafeta.id, ...corpo }, { onSuccess: () => setAAcertar(null) })
          }
        />
      )}
    </div>
  );
}
