import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, RefreshCw, Truck, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn, formatDataHora, formatMoeda } from '@/shared/utils';
import { Can } from '@/features/auth';
import { BadgeEstadoPedidoCommerce } from './BadgeEstadoPedidoCommerce';
import { SubstituirItemModal } from './SubstituirItemModal';
import {
  useCancelarPedidoCommerce,
  useConferirPedidoCommerce,
  useConfirmarLevantamentoCommerce,
  useExpedirPedidoCommerce,
  useConfirmarPedidoCommerce,
  useIniciarPreparacaoCommerce,
  useSubstituirItemCommerce,
} from '../hooks/usePedidosCommerceGestao';
import { type PedidoCommerceGestao, type PedidoItemCommerce } from '../types/pedido-commerce-gestao.types';

interface DetalhePedidoCommerceDrawerProps {
  pedido: PedidoCommerceGestao | null;
  onClose: () => void;
}

/**
 * O detalhe de um pedido do Compra Fácil, do lado do funcionário — a fila
 * completa: confirmar → iniciar preparação → conferência (com substituição
 * quando falta algo) → confirmar levantamento (cria a Venda real).
 *
 * Recebe o `pedido` já carregado pela lista (`usePedidosCommerceGestao`) em vez
 * de o ir buscar de novo — a fila de um funcionário não é grande o suficiente
 * para justificar um endpoint de detalhe próprio, e cada mutação já invalida a
 * lista, que arrasta este drawer para o estado mais recente.
 */
export function DetalhePedidoCommerceDrawer({ pedido, onClose }: DetalhePedidoCommerceDrawerProps) {
  const { t } = useTranslation('lojaGestao');
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [itemASubstituir, setItemASubstituir] = useState<PedidoItemCommerce | null>(null);
  const [aConfirmarLevantamento, setAConfirmarLevantamento] = useState(false);
  const [aDespachar, setADespachar] = useState(false);
  const [aCancelar, setACancelar] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  // A sugestão de sequência de picking (por localização no armazém) só vem na
  // resposta de `iniciarPreparacao` — a lista normal não a traz. Guardada aqui
  // porque é do momento, não um dado persistido no Pedido.
  const [sequenciaPickingIds, setSequenciaPickingIds] = useState<string[] | null>(null);

  const confirmar = useConfirmarPedidoCommerce();
  const iniciarPreparacao = useIniciarPreparacaoCommerce();
  const conferir = useConferirPedidoCommerce();
  const substituirItem = useSubstituirItemCommerce();
  const confirmarLevantamento = useConfirmarLevantamentoCommerce();
  const expedir = useExpedirPedidoCommerce();
  const cancelarPedido = useCancelarPedidoCommerce();

  // Só reinicia ao abrir um pedido *diferente* — não a cada refetch automático
  // da lista (30s) ou depois de cada mutação, que trocam a referência do objecto
  // `pedido` mesmo com o mesmo id. Sem isto, uma quantidade que o funcionário
  // ainda estivesse a digitar era apagada a meio da conferência.
  useEffect(() => {
    if (!pedido) return;
    setQuantidades(Object.fromEntries(pedido.itens.map((item) => [item.id, item.quantidade])));
    setAConfirmarLevantamento(false);
    setADespachar(false);
    setACancelar(false);
    setMotivoCancelamento('');
    setSequenciaPickingIds(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido?.id]);

  if (!pedido) return null;

  const itensPorResolver = pedido.itens.filter(
    (item) => !item.substituicao && item.quantidadeConferida !== null && item.quantidadeConferida < item.quantidade,
  );

  const conferenciaInvalida = pedido.itens
    .filter((item) => !item.substituicao)
    .some((item) => {
      const valor = quantidades[item.id] ?? item.quantidade;
      return !Number.isFinite(valor) || valor < 0 || valor > item.quantidade;
    });

  // Ordena pela sequência de picking sugerida quando existe (§8.2 — por
  // `Localizacao.caminho`, para o funcionário não andar às voltas no armazém);
  // sem ela, mantém a ordem em que o carrinho foi fechado.
  const itensParaMostrar = sequenciaPickingIds
    ? [...pedido.itens].sort(
        (a, b) => sequenciaPickingIds.indexOf(a.id) - sequenciaPickingIds.indexOf(b.id),
      )
    : pedido.itens;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{pedido.numeroPedido}</h2>
            <p className="text-xs text-slate-400">{formatDataHora(pedido.createdAt)}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">{pedido.cliente.nome}</p>
              <p className="text-xs text-slate-400">{pedido.cliente.telefone ?? t('drawer.sem_telefone')} · {pedido.loja.nome}</p>
            </div>
            <BadgeEstadoPedidoCommerce estado={pedido.estado} tipoEntrega={pedido.tipoEntrega} />
          </div>

          {pedido.tipoEntrega === 'ENTREGA' && pedido.endereco && (
            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-sm">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-blue-700">
                <Truck size={12} />
                {t('drawer.entrega_titulo')}
              </p>
              <p className="mt-1.5 font-medium text-slate-800">
                {pedido.endereco.linha1}
                {pedido.endereco.bairro ? `, ${pedido.endereco.bairro}` : ''}
              </p>
              <p className="text-xs text-slate-500">
                {pedido.endereco.cidade}, {pedido.endereco.provincia}
              </p>
              {pedido.endereco.referencia && (
                <p className="mt-1 text-xs text-slate-500">{pedido.endereco.referencia}</p>
              )}
              {(pedido.endereco.contactoNome || pedido.endereco.contactoTelefone) && (
                <p className="mt-1 text-xs text-slate-500">
                  {[pedido.endereco.contactoNome, pedido.endereco.contactoTelefone].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          )}

          {pedido.estado === 'CANCELADO' && pedido.motivoCancelamento && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{pedido.motivoCancelamento}</p>
          )}

          {(pedido.estado === 'EXPEDIDO' || pedido.estado === 'EM_ROTA' || pedido.estado === 'FALHADA') && (
            <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
              {t('drawer.entrega_na_rua')}
            </p>
          )}

          {pedido.estado === 'CONCLUIDO' && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {t('drawer.venda_criada')}
            </p>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t('drawer.artigos_titulo')}
              {sequenciaPickingIds && <> — {t('drawer.ordem_recolha_sufixo')}</>}
            </p>
            <ul className="space-y-2">
              {itensParaMostrar.map((item, indice) => (
                <li key={item.id} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      {sequenciaPickingIds && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
                          {indice + 1}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">{item.produto.nome}</p>
                        <p className="text-xs text-slate-400">
                          {item.quantidade} × {formatMoeda(item.precoUnitario)}
                        </p>
                      </div>
                    </div>

                    {pedido.estado === 'EM_PREPARACAO' && !item.substituicao && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={item.quantidade}
                          value={quantidades[item.id] ?? item.quantidade}
                          onChange={(e) =>
                            setQuantidades((anterior) => ({ ...anterior, [item.id]: Number(e.target.value) }))
                          }
                          className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm focus:border-slate-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setItemASubstituir(item)}
                          className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                        >
                          <RefreshCw size={12} /> {t('drawer.substituir')}
                        </button>
                      </div>
                    )}

                    {!['EM_PREPARACAO'].includes(pedido.estado) && (
                      <p className="text-sm font-medium text-slate-700">{formatMoeda(item.subtotal)}</p>
                    )}
                  </div>

                  {item.substituicao && (
                    <div className="mt-2 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-800">
                      <p className="font-semibold">
                        {t('drawer.ajustado', {
                          aceite: item.substituicao.quantidadeAceite,
                          quantidade: item.quantidade,
                        })}
                        {item.substituicao.produtoSubstitutoId && <> {t('drawer.produto_substituto_sufixo')}</>}
                      </p>
                      <p className="mt-0.5">{item.substituicao.motivo}</p>
                      <p className="mt-0.5 text-orange-600">
                        {t('drawer.autorizado_por', {
                          canal: item.substituicao.canalAutorizacao ? t(`canal.${item.substituicao.canalAutorizacao}`) : '—',
                          registo: item.substituicao.registoAutorizacao,
                        })}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {pedido.tipoEntrega === 'ENTREGA' && (
            <div className="flex justify-between border-t border-slate-100 pt-3 text-sm text-slate-600">
              <span>{t('drawer.taxa_entrega')}</span>
              <span>{formatMoeda(pedido.taxaEntrega)}</span>
            </div>
          )}

          <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
            <span>{t('drawer.total')}</span>
            <span>{formatMoeda(pedido.totalFinal)}</span>
          </div>

          <Can action="manage" resource="pedidos_commerce">
            {['CRIADO', 'CONFIRMADO', 'EM_PREPARACAO', 'PRONTO'].includes(pedido.estado) && (
            <div className="border-t border-slate-100 pt-4">
              {pedido.estado === 'CRIADO' && (
                <button
                  type="button"
                  disabled={confirmar.isPending}
                  onClick={() => confirmar.mutate(pedido.id)}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {confirmar.isPending ? t('drawer.a_confirmar') : t('drawer.confirmar_pedido')}
                </button>
              )}

              {pedido.estado === 'CONFIRMADO' && (
                <button
                  type="button"
                  disabled={iniciarPreparacao.isPending}
                  onClick={() =>
                    iniciarPreparacao.mutate(pedido.id, {
                      onSuccess: (resultado) =>
                        setSequenciaPickingIds(resultado.sequenciaPicking.map((item) => item.id)),
                    })
                  }
                  className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {iniciarPreparacao.isPending ? t('drawer.a_iniciar') : t('drawer.iniciar_preparacao')}
                </button>
              )}

              {pedido.estado === 'EM_PREPARACAO' && (
                <>
                  {itensPorResolver.length > 0 && (
                    <p className="mb-2 flex items-center gap-1.5 text-xs text-amber-600">
                      <AlertTriangle size={14} />
                      {t('drawer.artigos_por_resolver', { count: itensPorResolver.length })}
                    </p>
                  )}
                  {conferenciaInvalida && (
                    <p className="mb-2 text-xs text-rose-500">
                      {t('drawer.quantidade_invalida')}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={conferir.isPending || conferenciaInvalida}
                    onClick={() =>
                      conferir.mutate({
                        id: pedido.id,
                        payload: {
                          itens: pedido.itens
                            .filter((item) => !item.substituicao)
                            .map((item) => ({
                              pedidoItemId: item.id,
                              quantidadeConferida: quantidades[item.id] ?? item.quantidade,
                            })),
                        },
                      })
                    }
                    className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {conferir.isPending ? t('drawer.a_conferir') : t('drawer.confirmar_conferencia')}
                  </button>
                </>
              )}

              {pedido.estado === 'PRONTO' && pedido.tipoEntrega === 'ENTREGA' && (
                <>
                  {!aDespachar ? (
                    <button
                      type="button"
                      onClick={() => setADespachar(true)}
                      className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      {t('drawer.despachar')}
                    </button>
                  ) : (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="text-sm text-amber-800">{t('drawer.aviso_despacho')}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setADespachar(false)}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                          {t('drawer.voltar')}
                        </button>
                        <button
                          type="button"
                          disabled={expedir.isPending}
                          onClick={() => expedir.mutate(pedido.id, { onSettled: () => setADespachar(false) })}
                          className={cn(
                            'flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700',
                            expedir.isPending && 'opacity-50',
                          )}
                        >
                          {expedir.isPending ? (
                            <span className="flex items-center justify-center gap-1.5">
                              <Loader2 size={14} className="animate-spin" /> {t('drawer.a_despachar')}
                            </span>
                          ) : (
                            t('drawer.sim_despachar')
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {pedido.estado === 'PRONTO' && pedido.tipoEntrega !== 'ENTREGA' && (
                <>
                  {!aConfirmarLevantamento ? (
                    <button
                      type="button"
                      onClick={() => setAConfirmarLevantamento(true)}
                      className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      {t('drawer.confirmar_levantamento')}
                    </button>
                  ) : (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="text-sm text-amber-800">
                        {t('drawer.aviso_levantamento')}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setAConfirmarLevantamento(false)}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                          {t('drawer.voltar')}
                        </button>
                        <button
                          type="button"
                          disabled={confirmarLevantamento.isPending}
                          onClick={() => confirmarLevantamento.mutate(pedido.id)}
                          className={cn(
                            'flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800',
                            confirmarLevantamento.isPending && 'opacity-50',
                          )}
                        >
                          {confirmarLevantamento.isPending ? (
                            <span className="flex items-center justify-center gap-1.5">
                              <Loader2 size={14} className="animate-spin" /> {t('drawer.a_confirmar')}
                            </span>
                          ) : (
                            t('drawer.sim_confirmar')
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/*
                A única saída para um pedido que já passou de CONFIRMADO: o cliente
                só cancela até aí, e a expiração automática só apanha os que ninguém
                confirmou. Sem isto, um pedido abandonado em preparação segurava a
                reserva de stock para sempre — e somava ao contador de pedidos por
                atender do painel, sem forma de o limpar.
              */}
              <div className="mt-3 border-t border-slate-100 pt-3">
                {!aCancelar ? (
                  <button
                    type="button"
                    onClick={() => setACancelar(true)}
                    className="w-full rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                  >
                    {t('drawer.cancelar_pedido')}
                  </button>
                ) : (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                    <p className="text-sm text-rose-800">
                      {t('drawer.aviso_cancelar')}
                    </p>
                    <textarea
                      value={motivoCancelamento}
                      onChange={(e) => setMotivoCancelamento(e.target.value)}
                      rows={2}
                      placeholder={t('drawer.motivo_placeholder')}
                      className="mt-2 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setACancelar(false);
                          setMotivoCancelamento('');
                        }}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                      >
                        {t('drawer.voltar')}
                      </button>
                      <button
                        type="button"
                        // O motivo é obrigatório no servidor; desactivar aqui evita o
                        // percurso de ida e volta só para receber um 400.
                        disabled={cancelarPedido.isPending || !motivoCancelamento.trim()}
                        onClick={() =>
                          cancelarPedido.mutate(
                            { id: pedido.id, payload: { motivo: motivoCancelamento.trim() } },
                            { onSuccess: () => setACancelar(false) },
                          )
                        }
                        className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                      >
                        {cancelarPedido.isPending ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <Loader2 size={14} className="animate-spin" /> {t('drawer.a_cancelar')}
                          </span>
                        ) : (
                          t('drawer.cancelar_pedido')
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}
          </Can>
        </div>
      </div>

      <SubstituirItemModal
        item={itemASubstituir}
        isSubmitting={substituirItem.isPending}
        onClose={() => setItemASubstituir(null)}
        onConfirm={(payload) =>
          substituirItem.mutate(
            { id: pedido.id, itemId: itemASubstituir!.id, payload },
            { onSuccess: () => setItemASubstituir(null) },
          )
        }
      />
    </>
  );
}
