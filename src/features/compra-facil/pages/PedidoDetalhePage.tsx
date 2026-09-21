import { Navigate, useParams } from 'react-router-dom';
import { Check, CheckCircle2, Clock, Loader2, PackageCheck, XCircle } from 'lucide-react';
import { cn, formatDataHora, formatMoeda } from '@/shared/utils';
import { useContaClienteStore } from '../store/useContaClienteStore';
import { useCancelarPedido, usePedido } from '../hooks/usePedidosCommerce';
import { LojaTopo } from '../components/LojaTopo';
import { VoltarLink } from '../components/VoltarLink';
import { ETIQUETA_ESTADO_PEDIDO, ETIQUETA_METODO_PAGAMENTO } from '../api/pedidos.api';
import type { EstadoPedido, MetodoPagamentoCommerce } from '../api/pedidos.api';

/** Estados a partir dos quais o cliente ainda pode desistir — espelha o backend. */
const CANCELAVEL: EstadoPedido[] = ['CRIADO', 'AGUARDA_CONFIRMACAO', 'CONFIRMADO'];

/**
 * Os passos que o cliente vê — Fase 12. `AGUARDA_CONFIRMACAO` conta como
 * "Recebido" e `AGUARDA_LEVANTAMENTO` como "Pronto a levantar": são variações
 * internas do mesmo momento visto de fora, não passos extra.
 */
const PASSOS: { estados: EstadoPedido[]; label: string }[] = [
  { estados: ['CRIADO', 'AGUARDA_CONFIRMACAO'], label: 'Recebido' },
  { estados: ['CONFIRMADO'], label: 'Confirmado' },
  { estados: ['EM_PREPARACAO'], label: 'Em preparação' },
  { estados: ['PRONTO', 'AGUARDA_LEVANTAMENTO'], label: 'Pronto a levantar' },
  { estados: ['CONCLUIDO'], label: 'Entregue' },
];

export function PedidoDetalhePage() {
  const { lojaId, pedidoId } = useParams<{ lojaId: string; pedidoId: string }>();
  const { autenticado, aCarregar } = useContaClienteStore();
  const { data: pedido, isLoading } = usePedido(pedidoId);
  const cancelar = useCancelarPedido();

  if (!lojaId || !pedidoId) return null;

  if (!aCarregar && !autenticado) {
    return <Navigate to={`/loja/${lojaId}/entrar`} replace />;
  }

  return (
    <div>
      <LojaTopo lojaId={lojaId} />

      <div className="cc-caixa max-w-xl py-8">
        <VoltarLink to={`/loja/${lojaId}/pedidos`}>Os meus pedidos</VoltarLink>

        {(isLoading || aCarregar) && (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 size={22} className="animate-spin text-slate-400" />
          </div>
        )}

        {pedido && (
          <>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-slate-900">{pedido.numeroPedido}</p>
                  <p className="text-xs text-slate-400">{formatDataHora(pedido.createdAt)}</p>
                </div>
                <EstadoBadge estado={pedido.estado} />
              </div>

              {pedido.estado === 'CANCELADO' && pedido.motivoCancelamento && (
                <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {pedido.motivoCancelamento}
                </p>
              )}

              {pedido.estado !== 'CANCELADO' && <LinhaDoTempoPedido estado={pedido.estado} />}

              <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                {pedido.itens.map((item) => (
                  <li key={item.id}>
                    <div className="flex justify-between">
                      <span>{item.quantidade}× produto</span>
                      <span>{formatMoeda(item.subtotal)}</span>
                    </div>
                    {item.substituicao && (
                      <p className="mt-1 rounded-lg bg-orange-50 px-2.5 py-1.5 text-xs text-orange-800">
                        Ajustámos este artigo: {item.substituicao.quantidadeAceite} de {item.quantidade}
                        {item.substituicao.produtoSubstitutoId ? ' (produto de substituição)' : ''} —{' '}
                        {item.substituicao.motivo}
                      </p>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
                <span>Total</span>
                <span>{formatMoeda(pedido.totalFinal)}</span>
              </div>

              <p className="mt-2 text-xs text-slate-400">
                {ETIQUETA_METODO_PAGAMENTO[pedido.metodoPagamento as MetodoPagamentoCommerce]}
              </p>
            </div>

            {CANCELAVEL.includes(pedido.estado) && (
              <button
                type="button"
                onClick={() => cancelar.mutate(pedido.id)}
                disabled={cancelar.isPending}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:underline disabled:opacity-50"
              >
                <XCircle size={14} />
                Cancelar pedido
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** A linha do tempo do acompanhamento — Fase 12. Nunca mostrada para um pedido cancelado. */
function LinhaDoTempoPedido({ estado }: { estado: EstadoPedido }) {
  const passoActual = PASSOS.findIndex((passo) => passo.estados.includes(estado));

  return (
    <ol className="mt-4 flex items-center border-t border-slate-100 pt-4">
      {PASSOS.map((passo, indice) => {
        const concluido = indice < passoActual;
        const actual = indice === passoActual;
        return (
          <li key={passo.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                  concluido && 'bg-emerald-500 text-white',
                  actual && 'bg-blue-600 text-white',
                  !concluido && !actual && 'bg-slate-100 text-slate-400',
                )}
              >
                {concluido ? <Check size={12} /> : indice + 1}
              </div>
              <span
                className={cn(
                  'w-16 text-center text-[10px] leading-tight',
                  actual ? 'font-semibold text-slate-700' : 'text-slate-400',
                )}
              >
                {passo.label}
              </span>
            </div>
            {indice < PASSOS.length - 1 && (
              <div className={cn('mx-1 h-0.5 flex-1', concluido ? 'bg-emerald-500' : 'bg-slate-100')} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  const config: Record<EstadoPedido, { cor: string; icone: typeof Clock }> = {
    CRIADO: { cor: 'bg-amber-100 text-amber-800', icone: Clock },
    AGUARDA_CONFIRMACAO: { cor: 'bg-amber-100 text-amber-800', icone: Clock },
    CONFIRMADO: { cor: 'bg-blue-100 text-blue-800', icone: Clock },
    EM_PREPARACAO: { cor: 'bg-blue-100 text-blue-800', icone: PackageCheck },
    PRONTO: { cor: 'bg-emerald-100 text-emerald-800', icone: PackageCheck },
    AGUARDA_LEVANTAMENTO: { cor: 'bg-emerald-100 text-emerald-800', icone: PackageCheck },
    CONCLUIDO: { cor: 'bg-emerald-100 text-emerald-800', icone: CheckCircle2 },
    CANCELADO: { cor: 'bg-rose-100 text-rose-800', icone: XCircle },
  };

  const { cor, icone: Icone } = config[estado];

  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cor}`}>
      <Icone size={12} />
      {ETIQUETA_ESTADO_PEDIDO[estado]}
    </span>
  );
}
