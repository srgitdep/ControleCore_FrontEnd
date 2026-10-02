import { useState } from 'react';
import { X, Loader2, Package, ArrowRightLeft, ShoppingCart, Truck, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatMoeda, formatData, formatDataHora } from '@/shared/utils';
import { cn } from '@/shared/utils';
import {
  useDetalheNecessidade,
  useCriarRequisicaoDeNecessidade,
  useCriarTransferenciaDeNecessidade,
  useIgnorarNecessidade,
} from '../hooks/useNecessidades';
import { IgnorarNecessidadeModal } from './IgnorarNecessidadeModal';

interface DetalheNecessidadeDrawerProps {
  necessidadeId: string | null;
  onClose: () => void;
}

/**
 * O Detalhe da Necessidade — DT01 11.
 *
 * Sete secções: situação actual, procura, abastecimento, rede, compras, fornecedor e
 * MAYRA. As sete primeiras vêm do backend tal como estão aqui; MAYRA fica por ligar —
 * é a Fase 4, o módulo `ai-copilot` ainda não expõe uma leitura por necessidade.
 *
 * Aberto como drawer lateral e não como navegação de página, para "manter o contexto da
 * lista" (DT01 11): fechar o drawer devolve exactamente ao filtro e à página em que se
 * estava.
 */
export function DetalheNecessidadeDrawer({ necessidadeId, onClose }: DetalheNecessidadeDrawerProps) {
  const { t } = useTranslation('necessidades');
  const [aIgnorar, setAIgnorar] = useState(false);
  const { data: detalhe, isLoading } = useDetalheNecessidade(necessidadeId);
  const criarRequisicao = useCriarRequisicaoDeNecessidade();
  const criarTransferencia = useCriarTransferenciaDeNecessidade();
  const ignorar = useIgnorarNecessidade();

  const isOpen = !!necessidadeId;
  if (!isOpen) return null;

  const podeAgir = detalhe?.estado === 'ACTIVA';

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl transform flex-col bg-white shadow-xl transition-transform duration-300">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {detalhe?.produto.nome ?? t('detalhe.titulo_por_omissao')}
            </h2>
            {detalhe && (
              <p className="text-xs text-slate-400">
                {detalhe.produto.sku ?? detalhe.produto.codigoBarras} · {detalhe.loja.nome}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label={t('detalhe.fechar')}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading || !detalhe ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">{t('detalhe.a_carregar')}</p>
            </div>
          ) : (
            <div className="space-y-6 p-6">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {t(`recomendacao.${detalhe.recomendacao}`)}
                </span>
                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                  {t('detalhe.urgencia', { nivel: t(`urgencia.${detalhe.urgencia}`) })}
                </span>
              </div>

              {/* Situação actual */}
              <Secao icone={Package} titulo={t('detalhe.situacao')}>
                <div className="grid grid-cols-3 gap-3">
                  <Metrica label={t('detalhe.fisico')} valor={detalhe.situacao.stockFisico} />
                  <Metrica label={t('detalhe.disponivel')} valor={detalhe.situacao.stockDisponivel} />
                  <Metrica label={t('detalhe.minimo')} valor={detalhe.situacao.stockMinimo} />
                </div>
                {detalhe.situacao.porArmazem.length > 1 && (
                  <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
                    {detalhe.situacao.porArmazem.map((a) => (
                      <div key={a.armazemId} className="flex justify-between text-slate-600">
                        <span>{a.armazemNome}</span>
                        <span className="tabular-nums">{t('detalhe.unidades', { n: a.quantidade })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Secao>

              {/* Procura */}
              <Secao icone={History} titulo={t('detalhe.procura')}>
                <div className="grid grid-cols-2 gap-3">
                  <Metrica label={t('detalhe.media_diaria')} valor={t('detalhe.media_diaria_valor', { n: detalhe.procura.mediaDiaria })} />
                  <Metrica
                    label={t('detalhe.vendido_janela')}
                    valor={t('detalhe.vendido_janela_valor', {
                      vendido: detalhe.procura.vendidoNaJanela,
                      janela: detalhe.procura.janelaDias,
                    })}
                  />
                </div>
                {detalhe.procura.diasDesdeUltimaVenda !== null && (
                  <p className="mt-2 text-xs text-slate-400">
                    {t('detalhe.ultima_venda', { count: detalhe.procura.diasDesdeUltimaVenda })}
                  </p>
                )}
              </Secao>

              {/* Abastecimento */}
              <Secao icone={ShoppingCart} titulo={t('detalhe.abastecimento')}>
                <div className="grid grid-cols-2 gap-3">
                  <Metrica label={t('detalhe.quantidade_sugerida')} valor={t('detalhe.unidades', { n: detalhe.abastecimento.quantidadeSugerida })} />
                  <Metrica label={t('detalhe.valor_estimado')} valor={formatMoeda(detalhe.abastecimento.valorEstimado)} />
                  <Metrica
                    label={t('detalhe.cobertura_actual')}
                    valor={detalhe.abastecimento.diasCobertura !== null ? t('comum.dias', { count: detalhe.abastecimento.diasCobertura }) : '—'}
                  />
                  <Metrica
                    label={t('detalhe.data_ruptura')}
                    valor={
                      detalhe.abastecimento.dataPrevistaRuptura
                        ? formatData(detalhe.abastecimento.dataPrevistaRuptura)
                        : '—'
                    }
                  />
                </div>
              </Secao>

              {/* Rede */}
              <Secao icone={ArrowRightLeft} titulo={t('detalhe.rede')}>
                {detalhe.rede.oportunidades.length === 0 ? (
                  <p className="text-sm text-slate-400">{t('detalhe.sem_stock_rede')}</p>
                ) : (
                  <div className="space-y-2">
                    {detalhe.rede.oportunidades.map((o) => (
                      <div
                        key={o.origemArmazemId}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                      >
                        <span className="text-slate-700">{o.origemLojaNome}</span>
                        <div className="flex items-center gap-2">
                          <span className="tabular-nums font-medium text-slate-800">
                            {t('detalhe.unidades_disponiveis', { n: o.quantidadeDisponivel })}
                          </span>
                          {podeAgir && (
                            <button
                              type="button"
                              disabled={criarTransferencia.isPending}
                              onClick={() =>
                                criarTransferencia.mutate({
                                  necessidadeId: detalhe.id,
                                  origemLojaId: o.origemLojaId,
                                  quantidade: o.quantidadeDisponivel,
                                })
                              }
                              className="shrink-0 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                            >
                              {t('detalhe.transferir')}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Secao>

              {/* Compras */}
              <Secao icone={Truck} titulo={t('detalhe.compras')}>
                {detalhe.compras.requisicoes.length === 0 && detalhe.compras.ordensCompra.length === 0 ? (
                  <p className="text-sm text-slate-400">{t('detalhe.sem_compras')}</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    {detalhe.compras.requisicoes.map((r) => (
                      <div key={r.id} className="text-slate-600">
                        <div className="flex justify-between">
                          <span>{t('detalhe.requisicao', { numero: r.numero })}</span>
                          <span className="text-xs text-slate-400">{r.estado}</span>
                        </div>
                        {/* RFQ/sourcing adjudicado — DT01 §17: a ligação
                            requisição→RFQ→OC visível a partir da necessidade. */}
                        {r.sourcing && (
                          <div className="mt-0.5 flex justify-between pl-3 text-xs text-slate-400">
                            <span>{t('detalhe.rfq', { n: r.sourcing.candidatosAvaliados })}</span>
                            <span>{r.sourcing.estado}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {detalhe.compras.ordensCompra.map((o) => (
                      <div key={o.id} className="flex justify-between text-slate-600">
                        <span>{t('detalhe.oc', { fornecedor: o.fornecedor })}</span>
                        <span className="tabular-nums text-xs text-slate-400">
                          {t('detalhe.oc_recebido', { recebida: o.quantidadeRecebida, pedida: o.quantidadePedida })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Secao>

              {/* Fornecedor */}
              {detalhe.fornecedor && (
                <Secao icone={ShoppingCart} titulo={t('detalhe.fornecedor')}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{detalhe.fornecedor.nome}</span>
                    <span className="tabular-nums font-medium text-slate-800">
                      {formatMoeda(detalhe.fornecedor.custoCompra)}
                    </span>
                  </div>
                </Secao>
              )}

              {/* Histórico — DT01 15.3 */}
              {detalhe.historico.length > 0 && (
                <Secao icone={History} titulo={t('detalhe.historico')}>
                  <ol className="space-y-3 border-l border-slate-100 pl-4">
                    {detalhe.historico.map((h, i) => (
                      <li key={i} className="text-sm">
                        <p className="font-medium text-slate-700">{h.accao}</p>
                        {h.observacoes && <p className="text-slate-500">{h.observacoes}</p>}
                        <p className="text-xs text-slate-400">
                          {formatDataHora(h.createdAt)}
                          {h.utilizador ? ` · ${h.utilizador}` : ''}
                        </p>
                      </li>
                    ))}
                  </ol>
                </Secao>
              )}
            </div>
          )}
        </div>

        {podeAgir && (
          <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            {['COMPRAR', 'TRANSFERIR'].includes(detalhe!.recomendacao) && (
              <button
                type="button"
                disabled={criarRequisicao.isPending}
                onClick={() =>
                  criarRequisicao.mutate({ necessidadeId: detalhe!.id }, { onSuccess: onClose })
                }
                className={cn(
                  'flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800',
                  criarRequisicao.isPending && 'opacity-60',
                )}
              >
                {criarRequisicao.isPending ? t('detalhe.a_criar') : t('detalhe.criar_requisicao')}
              </button>
            )}
            <button
              type="button"
              onClick={() => setAIgnorar(true)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              {t('detalhe.nao_comprar')}
            </button>
          </div>
        )}
      </div>

      {detalhe && (
        <IgnorarNecessidadeModal
          isOpen={aIgnorar}
          isSubmitting={ignorar.isPending}
          onClose={() => setAIgnorar(false)}
          onConfirm={(motivo) =>
            ignorar.mutate(
              { necessidadeId: detalhe.id, motivo },
              { onSuccess: () => { setAIgnorar(false); onClose(); } },
            )
          }
        />
      )}
    </>
  );
}

function Secao({
  icone: Icone,
  titulo,
  children,
}: {
  icone: React.ElementType;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Icone size={16} strokeWidth={1.5} className="text-slate-400" />
        {titulo}
      </div>
      {children}
    </div>
  );
}

function Metrica({ label, valor }: { label: string; valor: string | number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="tabular-nums text-sm font-semibold text-slate-800">{valor}</p>
    </div>
  );
}
