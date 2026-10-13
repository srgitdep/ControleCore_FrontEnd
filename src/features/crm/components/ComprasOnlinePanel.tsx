import { useTranslation } from 'react-i18next';
import { AlertTriangle, BadgeCheck, MapPin, ShoppingBag } from 'lucide-react';
import { cn, formatData, formatDataHora, formatMoeda } from '@/shared/utils';
import { useComprasOnlineDoCliente } from '../hooks/useClientes';

/**
 * As compras online de um cliente, no seu detalhe (plano §4.13, D3): o resumo, a conta, os pedidos e as moradas.
 * Só aparece o que é desta empresa. Os quatro estados — a carregar, erro, sem compras e com compras — estão tratados.
 */
export function ComprasOnlinePanel({ clienteId }: { clienteId: string }) {
  const { t } = useTranslation('crm');
  const { data, isLoading, isError, refetch } = useComprasOnlineDoCliente(clienteId);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <ShoppingBag size={15} className="text-slate-400" />
        {t('compras_online.titulo')}
      </h3>

      {isLoading ? (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : isError || !data ? (
        <p className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle size={15} />
          {t('compras_online.erro')}
          <button type="button" onClick={() => void refetch()} className="font-semibold underline">
            {t('compras_online.tentar_outra_vez')}
          </button>
        </p>
      ) : (
        <div className="mt-4 space-y-5">
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <dt className="text-xs text-slate-500">{t('compras_online.pedidos')}</dt>
              <dd className="text-lg font-bold tabular-nums text-slate-900">{data.resumo.pedidos}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <dt className="text-xs text-slate-500">{t('compras_online.total')}</dt>
              <dd className="text-lg font-bold tabular-nums text-slate-900">{formatMoeda(data.resumo.total)}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <dt className="text-xs text-slate-500">{t('compras_online.ultimo_pedido')}</dt>
              <dd className="text-sm font-semibold text-slate-900">
                {data.resumo.ultimoPedidoEm ? formatData(data.resumo.ultimoPedidoEm) : '—'}
              </dd>
            </div>
          </dl>

          {data.conta && (
            <p className="flex flex-wrap items-center gap-1.5 text-xs">
              {data.conta.emailVerificado && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                  <BadgeCheck size={11} />
                  {t('compras_online.email_verificado')}
                </span>
              )}
              {data.conta.viaGoogle && <span className="rounded-full bg-sky-50 px-2 py-0.5 font-semibold text-sky-700">{t('compras_online.google')}</span>}
              {!data.conta.activa && <span className="rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-700">{t('compras_online.conta_inactiva')}</span>}
              {data.conta.ultimoAcessoEm && (
                <span className="text-slate-400">{t('compras_online.ultimo_acesso', { data: formatDataHora(data.conta.ultimoAcessoEm) })}</span>
              )}
            </p>
          )}

          {data.pedidos.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{t('compras_online.sem_pedidos')}</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">{t('compras_online.col_pedido')}</th>
                    <th className="px-3 py-2">{t('compras_online.col_data')}</th>
                    <th className="px-3 py-2">{t('compras_online.col_loja')}</th>
                    <th className="px-3 py-2">{t('compras_online.col_estado')}</th>
                    <th className="px-3 py-2 text-right">{t('compras_online.col_total')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.pedidos.map((p) => (
                    <tr key={p.id} className={cn(p.estado === 'CANCELADO' && 'text-slate-400')}>
                      <td className="px-3 py-2 font-medium">
                        {p.numeroPedido}
                        {p.tipoEntrega === 'ENTREGA' && <span className="ml-1.5 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-blue-700">{t('compras_online.entrega')}</span>}
                      </td>
                      <td className="px-3 py-2 text-xs">{formatDataHora(p.createdAt)}</td>
                      <td className="px-3 py-2">{p.loja.nome}</td>
                      <td className="px-3 py-2 text-xs">{t(`compras_online.estado.${p.estado as 'CRIADO'}`, { defaultValue: p.estado })}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatMoeda(p.totalFinal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.enderecos.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <MapPin size={12} />
                {t('compras_online.moradas')}
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {data.enderecos.map((e) => (
                  <li key={e.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <p className="font-medium text-slate-800">
                      {e.rotulo ?? t('compras_online.morada')}
                      {e.isPadrao && <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{t('compras_online.padrao')}</span>}
                    </p>
                    <p className="text-slate-600">
                      {e.linha1}
                      {e.bairro ? `, ${e.bairro}` : ''}
                    </p>
                    <p className="text-xs text-slate-500">
                      {e.cidade}, {e.provincia}
                    </p>
                    {e.referencia && <p className="mt-0.5 text-xs text-slate-500">{e.referencia}</p>}
                    {(e.contactoNome || e.contactoTelefone) && (
                      <p className="mt-0.5 text-xs text-slate-500">{[e.contactoNome, e.contactoTelefone].filter(Boolean).join(' · ')}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
