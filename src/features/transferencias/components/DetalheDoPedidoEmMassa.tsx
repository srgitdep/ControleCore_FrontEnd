import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowRight, Loader2, Package, X } from 'lucide-react';
import { formatDataHora } from '@/shared/utils';
import { BadgeEstadoTransferencia } from './BadgeEstadoTransferencia';
import { MotivoAccaoModal } from './MotivoAccaoModal';
import { useAccaoDoGrupo, useDetalheDoGrupo } from '../hooks/useTransferencias';
import type { EstadoTransferencia, ResultadoDaAccaoDoGrupo } from '../types/transferencia.types';

/**
 * Um pedido em massa (plano §4.12): o cabeçalho (referência, de onde para onde, quem pediu) e as suas linhas, com o
 * estado de cada uma, e as acções que valem para o conjunto: aprovar, expedir, receber ou cancelar «tudo o que se
 * puder». Cada acção corre linha a linha — as que falham ficam listadas, com o motivo, e as outras seguem.
 */
export function DetalheDoPedidoEmMassa({ grupoId, aoFechar }: { grupoId: string; aoFechar: () => void }) {
  const { t } = useTranslation('transferencias');
  const { data: grupo, isLoading, isError, refetch } = useDetalheDoGrupo(grupoId);
  const accao = useAccaoDoGrupo(grupoId);
  const [resultado, setResultado] = useState<ResultadoDaAccaoDoGrupo | null>(null);
  const [aRecusar, setARecusar] = useState(false);
  const [aCancelar, setACancelar] = useState(false);

  const contagem = (estado: EstadoTransferencia) => grupo?.linhas.filter((l) => l.estado === estado).length ?? 0;
  const porDecidir = contagem('SOLICITADA');
  const aprovadas = contagem('APROVADA');
  const expedidas = contagem('EXPEDIDA');

  const correr = (a: Parameters<typeof accao.mutate>[0]) => accao.mutate(a, { onSuccess: setResultado });
  const nomeDoProduto = (produtoId: string) => grupo?.linhas.find((l) => l.produto.id === produtoId)?.produto.nome ?? produtoId;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/50" onClick={aoFechar} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-xl" role="dialog" aria-modal="true" aria-label={t('grupo.titulo')}>
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{grupo?.referencia ?? t('grupo.titulo')}</h2>
            {grupo && <p className="text-xs text-slate-400">{t('grupo.pedido_por', { nome: grupo.solicitadaPor.name, data: formatDataHora(grupo.createdAt) })}</p>}
          </div>
          <button onClick={aoFechar} aria-label={t('detalhe.fechar')} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
          ) : isError || !grupo ? (
            <p className="flex flex-wrap items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle size={15} />
              {t('grupo.erro')}
              <button type="button" onClick={() => void refetch()} className="font-semibold underline">
                {t('nova.tentar_outra_vez')}
              </button>
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                <span className="font-medium text-slate-800">{grupo.origemArmazem?.nome ?? grupo.origemLoja.nome}</span>
                <span className="text-xs text-slate-400">({grupo.origemLoja.nome})</span>
                <ArrowRight size={14} className="text-slate-300" />
                <span className="font-medium text-slate-800">{grupo.destinoArmazem?.nome ?? grupo.destinoLoja.nome}</span>
                <span className="text-xs text-slate-400">({grupo.destinoLoja.nome})</span>
              </div>
              {grupo.motivo && <p className="text-sm text-slate-600">{grupo.motivo}</p>}

              {/* As acções do conjunto: só as que têm linhas por tratar. */}
              <div className="flex flex-wrap gap-2">
                {porDecidir > 0 && (
                  <>
                    <button type="button" disabled={accao.isPending} onClick={() => correr({ tipo: 'decidir', decisao: 'APROVAR' })} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50">
                      {t('grupo.aprovar_todas', { count: porDecidir })}
                    </button>
                    <button type="button" disabled={accao.isPending} onClick={() => setARecusar(true)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                      {t('grupo.recusar_todas')}
                    </button>
                  </>
                )}
                {aprovadas > 0 && (
                  <button type="button" disabled={accao.isPending} onClick={() => correr({ tipo: 'expedir' })} className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-50">
                    {t('grupo.expedir_todas', { count: aprovadas })}
                  </button>
                )}
                {expedidas > 0 && (
                  <button type="button" disabled={accao.isPending} onClick={() => correr({ tipo: 'receber' })} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                    {t('grupo.receber_todas', { count: expedidas })}
                  </button>
                )}
                {porDecidir + aprovadas > 0 && (
                  <button type="button" disabled={accao.isPending} onClick={() => setACancelar(true)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50">
                    {t('grupo.cancelar_todas')}
                  </button>
                )}
                {accao.isPending && <Loader2 size={16} className="animate-spin self-center text-slate-400" />}
              </div>
              {expedidas > 0 && <p className="text-xs text-slate-500">{t('grupo.receber_ajuda')}</p>}

              {resultado && (
                <div className={resultado.falhadas > 0 ? 'rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm' : 'rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm'} role="status">
                  <p className="font-medium text-slate-800">
                    {t('grupo.resultado', { feitas: resultado.feitas, falhadas: resultado.falhadas, ignoradas: resultado.ignoradas })}
                  </p>
                  {resultado.resultados.filter((r) => !r.ok).map((r) => (
                    <p key={r.transferenciaId} className="mt-1 text-xs text-amber-900">
                      <span className="font-semibold">{nomeDoProduto(r.produtoId)}:</span> {r.erro?.mensagem}
                    </p>
                  ))}
                </div>
              )}

              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {grupo.linhas.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Package size={16} className="shrink-0 text-slate-300" aria-hidden />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{l.produto.nome}</p>
                        <p className="text-xs tabular-nums text-slate-400">
                          {t('grupo.quantidades', { pedida: l.quantidadeSolicitada, expedida: l.quantidadeExpedida ?? '—', recebida: l.quantidadeRecebida ?? '—' })}
                        </p>
                        {l.motivoCancelamento && <p className="text-xs text-rose-600">{l.motivoCancelamento}</p>}
                      </div>
                    </div>
                    <BadgeEstadoTransferencia estado={l.estado} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <MotivoAccaoModal
        isOpen={aRecusar}
        isSubmitting={accao.isPending}
        titulo={t('pagina.recusar_titulo')}
        descricao={t('pagina.recusar_descricao')}
        placeholder={t('pagina.recusar_placeholder')}
        onClose={() => setARecusar(false)}
        onConfirm={(motivo) => accao.mutate({ tipo: 'decidir', decisao: 'RECUSAR', motivo }, { onSuccess: (r) => { setResultado(r); setARecusar(false); } })}
      />
      <MotivoAccaoModal
        isOpen={aCancelar}
        isSubmitting={accao.isPending}
        titulo={t('pagina.cancelar_titulo')}
        descricao={t('pagina.cancelar_descricao')}
        corBotao="danger"
        onClose={() => setACancelar(false)}
        onConfirm={(motivo) => accao.mutate({ tipo: 'cancelar', motivo }, { onSuccess: (r) => { setResultado(r); setACancelar(false); } })}
      />
    </>
  );
}
