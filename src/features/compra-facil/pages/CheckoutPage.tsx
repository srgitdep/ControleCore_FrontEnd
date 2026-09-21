import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { formatMoeda } from '@/shared/utils';
import { useCarrinhoStore } from '../store/useCarrinhoStore';
import { useContaClienteStore } from '../store/useContaClienteStore';
import { useCriarPedido } from '../hooks/usePedidosCommerce';
import { LojaTopo } from '../components/LojaTopo';
import { ETIQUETA_METODO_PAGAMENTO } from '../api/pedidos.api';
import type { MetodoPagamentoCommerce } from '../api/pedidos.api';

const METODOS: MetodoPagamentoCommerce[] = ['NUMERARIO', 'MPESA', 'EMOLA'];

/**
 * O checkout: confirma o método de pagamento e fecha o pedido.
 *
 * Paga-se sempre no levantamento (Docs/plano_compra_facil.md §4.1) — sem gateway na
 * v1. Este ecrã só regista a **intenção**; o funcionário cobra fisicamente quando o
 * cliente levanta.
 */
export function CheckoutPage() {
  const { lojaId } = useParams<{ lojaId: string }>();
  const navegar = useNavigate();
  const { itens, lojaId: lojaDoCarrinho, getSubtotal, limpar } = useCarrinhoStore();
  const { autenticado, aCarregar } = useContaClienteStore();
  const criarPedido = useCriarPedido();

  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamentoCommerce>('NUMERARIO');

  if (!lojaId) return null;

  if (aCarregar) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={22} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to={`/loja/${lojaId}/entrar`} state={{ de: `/loja/${lojaId}/checkout` }} replace />;
  }

  if (itens.length === 0 || lojaDoCarrinho !== lojaId) {
    return <Navigate to={`/loja/${lojaId}/carrinho`} replace />;
  }

  const confirmar = () => {
    criarPedido.mutate(
      {
        lojaId,
        itens: itens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
        metodoPagamento,
      },
      {
        onSuccess: (pedido) => {
          limpar();
          navegar(`/loja/${lojaId}/pedidos/${pedido.id}`, { replace: true });
        },
      },
    );
  };

  return (
    <div>
      <LojaTopo lojaId={lojaId} />

      <div className="cc-caixa max-w-2xl py-8">
        <h1 className="mb-5 text-xl font-bold text-slate-900">Confirmar pedido</h1>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-sm font-medium text-slate-700">Resumo</p>
          <ul className="space-y-1 text-sm text-slate-600">
            {itens.map((item) => (
              <li key={item.produtoId} className="flex justify-between">
                <span>
                  {item.quantidade}× {item.nome}
                </span>
                <span>{formatMoeda(item.precoVenda * item.quantidade)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
            <span>Total</span>
            <span>{formatMoeda(getSubtotal())}</span>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-medium text-slate-700">Pagamento no levantamento</p>
          <div className="space-y-2">
            {METODOS.map((metodo) => (
              <label
                key={metodo}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
              >
                <input
                  type="radio"
                  name="metodoPagamento"
                  value={metodo}
                  checked={metodoPagamento === metodo}
                  onChange={() => setMetodoPagamento(metodo)}
                />
                {ETIQUETA_METODO_PAGAMENTO[metodo]}
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Não é cobrado agora. Paga na loja, no momento em que levantar o pedido.
          </p>
        </div>

        <button
          type="button"
          onClick={confirmar}
          disabled={criarPedido.isPending}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {criarPedido.isPending && <Loader2 size={16} className="animate-spin" />}
          Confirmar pedido
        </button>
      </div>
    </div>
  );
}
