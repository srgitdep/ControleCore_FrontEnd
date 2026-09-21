import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn, mensagemDeErro } from '@/shared/utils';
import { BarraDaPagina } from '@/shared/ui';
import { TabelaPedidosCommerce } from '../components/TabelaPedidosCommerce';
import { DetalhePedidoCommerceDrawer } from '../components/DetalhePedidoCommerceDrawer';
import { usePedidosCommerceGestao } from '../hooks/usePedidosCommerceGestao';
import { ETIQUETA_ESTADO_PEDIDO_COMMERCE, type EstadoPedidoCommerce, type PedidoCommerceGestao } from '../types/pedido-commerce-gestao.types';

const ESTADOS: EstadoPedidoCommerce[] = [
  'CRIADO',
  'CONFIRMADO',
  'EM_PREPARACAO',
  'PRONTO',
  'CONCLUIDO',
  'CANCELADO',
];

/**
 * A fila de pedidos do Compra Fácil — Fase 12
 * (Docs/plano_feature_compra_facil.md §8.2). Sem isto um pedido criado pelo
 * cliente ficava invisível do lado interno; é aqui que o funcionário confirma,
 * separa, confere e fecha o levantamento.
 */
export function PedidosCommercePage() {
  const [estado, setEstado] = useState<EstadoPedidoCommerce | undefined>(undefined);
  const [pedidoAberto, setPedidoAberto] = useState<PedidoCommerceGestao | null>(null);

  const { data: pedidos, isLoading, isError, error } = usePedidosCommerceGestao({ estado });

  // O drawer segue os dados mais recentes da lista (cada mutação invalida-a),
  // em vez de ficar preso à cópia do momento em que foi aberto.
  const pedidoActual = pedidoAberto ? (pedidos?.find((p) => p.id === pedidoAberto.id) ?? pedidoAberto) : null;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <BarraDaPagina resumo={pedidos ? `${pedidos.length} pedido(s)` : undefined} />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setEstado(undefined)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
            !estado ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
          )}
        >
          Todos
        </button>
        {ESTADOS.map((valor) => (
          <button
            key={valor}
            type="button"
            onClick={() => setEstado(valor)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              estado === valor ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {ETIQUETA_ESTADO_PEDIDO_COMMERCE[valor]}
          </button>
        ))}
      </div>

      {isError ? (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>{mensagemDeErro(error, 'Não foi possível carregar os pedidos do Compra Fácil.')}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <TabelaPedidosCommerce pedidos={pedidos ?? []} isLoading={isLoading} onAbrir={setPedidoAberto} />
        </div>
      )}

      <DetalhePedidoCommerceDrawer pedido={pedidoActual} onClose={() => setPedidoAberto(null)} />
    </div>
  );
}
