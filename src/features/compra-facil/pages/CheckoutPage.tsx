import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Banknote, Check, Loader2, Smartphone } from 'lucide-react';
import { cn, formatMoeda } from '@/shared/utils';
import { useCarrinhoStore } from '../store/useCarrinhoStore';
import { useContaClienteStore } from '../store/useContaClienteStore';
import { useCriarPedido } from '../hooks/usePedidosCommerce';
import { LojaTopo } from '../components/LojaTopo';
import { VoltarLink } from '../components/VoltarLink';
import { ETIQUETA_METODO_PAGAMENTO } from '../api/pedidos.api';
import type { MetodoPagamentoCommerce } from '../api/pedidos.api';

const METODOS: MetodoPagamentoCommerce[] = ['NUMERARIO', 'MPESA', 'EMOLA'];

const ICONE_METODO: Record<MetodoPagamentoCommerce, typeof Banknote> = {
  NUMERARIO: Banknote,
  MPESA: Smartphone,
  EMOLA: Smartphone,
};

/**
 * O checkout: confirma o método de pagamento e fecha o pedido.
 *
 * Paga-se sempre no levantamento (Docs/plano_compra_facil.md §4.1) — sem gateway na
 * v1. Este ecrã só regista a **intenção**; o funcionário cobra fisicamente quando o
 * cliente levanta.
 *
 * Mesmo esqueleto visual do carrinho (duas colunas, cartão de "Resumo do pedido"
 * fixo à direita) — é o passo seguinte do mesmo fluxo, e devia parecer o mesmo
 * ecrã a continuar, não outro produto. Método de pagamento como cartões
 * seleccionáveis (com ícone), em vez de uma lista de rádios em linha.
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

  const totalItens = itens.reduce((acc, i) => acc + i.quantidade, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <LojaTopo lojaId={lojaId} />

      <div className="cc-caixa max-w-5xl py-8">
        <VoltarLink to={`/loja/${lojaId}/carrinho`}>Voltar ao carrinho</VoltarLink>

        <h1 className="mb-6 text-2xl font-extrabold text-slate-900">Confirmar pedido</h1>

        <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
          <div className="space-y-6 lg:col-span-2">
            {/* Itens do pedido */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {totalItens} {totalItens === 1 ? 'artigo' : 'artigos'}
              </h2>
              <ul className="mt-3 divide-y divide-slate-100">
                {itens.map((item) => (
                  <li key={item.produtoId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="text-slate-700">
                      <span className="font-semibold text-slate-900">{item.quantidade}×</span> {item.nome}
                    </span>
                    <span className="shrink-0 font-medium text-slate-900">
                      {formatMoeda(item.precoVenda * item.quantidade)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Método de pagamento */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Pagamento no levantamento
              </h2>

              <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                {METODOS.map((metodo) => {
                  const Icone = ICONE_METODO[metodo];
                  const seleccionado = metodoPagamento === metodo;
                  return (
                    <label
                      key={metodo}
                      className={cn(
                        'relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-center transition-colors',
                        seleccionado ? 'border-blue-600 bg-blue-50/60' : 'border-slate-200 hover:border-slate-300',
                      )}
                    >
                      <input
                        type="radio"
                        name="metodoPagamento"
                        value={metodo}
                        checked={seleccionado}
                        onChange={() => setMetodoPagamento(metodo)}
                        className="sr-only"
                      />
                      {seleccionado && (
                        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white">
                          <Check size={10} />
                        </span>
                      )}
                      <Icone size={20} className={seleccionado ? 'text-blue-700' : 'text-slate-400'} />
                      <span className={cn('text-xs font-semibold', seleccionado ? 'text-blue-700' : 'text-slate-600')}>
                        {ETIQUETA_METODO_PAGAMENTO[metodo]}
                      </span>
                    </label>
                  );
                })}
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Não é cobrado agora. Paga na loja, no momento em que levantar o pedido.
              </p>
            </div>
          </div>

          {/* Resumo do pedido — o mesmo cartão do carrinho, o passo seguinte do mesmo fluxo */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-4">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Resumo do pedido</h2>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>{totalItens} {totalItens === 1 ? 'artigo' : 'artigos'}</span>
                  <span>{formatMoeda(getSubtotal())}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Pagamento</span>
                  <span>{ETIQUETA_METODO_PAGAMENTO[metodoPagamento]}</span>
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-4">
                <span className="text-sm font-semibold text-slate-900">Total</span>
                <span className="text-2xl font-extrabold text-blue-700">{formatMoeda(getSubtotal())}</span>
              </div>

              <button
                type="button"
                onClick={confirmar}
                disabled={criarPedido.isPending}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/30 transition-transform hover:scale-[1.02] hover:shadow-md disabled:opacity-50 disabled:hover:scale-100"
              >
                {criarPedido.isPending && <Loader2 size={16} className="animate-spin" />}
                Confirmar pedido
              </button>

              <p className="mt-3 text-center text-[11px] text-slate-400">
                Não é cobrado agora — paga na loja, no momento do levantamento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
