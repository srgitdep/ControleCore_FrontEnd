import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Minus, Package, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatMoeda } from '@/shared/utils';
import { useCarrinhoStore } from '../store/useCarrinhoStore';
import { useContaClienteStore } from '../store/useContaClienteStore';
import { LojaTopo } from '../components/LojaTopo';
import { VoltarLink } from '../components/VoltarLink';

/**
 * O carrinho — layout de duas colunas (itens + resumo do pedido fixo) em ecrã largo,
 * empilhado em telemóvel. Pedido explícito de UI/UX moderna, com referência a vários
 * carrinhos de e-commerce reais: lista de artigos com stepper de quantidade em pílula,
 * e um cartão de resumo à parte com o total em destaque e o botão de avançar — não a
 * barra plana de antes, com tudo em linha.
 *
 * O resumo só mostra o que existe de facto no Compra Fácil (sem código promocional,
 * sem portes — não há nenhum dos dois nesta funcionalidade): artigos, total, e a nota
 * de que se paga no levantamento, já usada no checkout.
 */
export function CarrinhoPage() {
  const { lojaId } = useParams<{ lojaId: string }>();
  const navegar = useNavigate();
  const { itens, actualizarQuantidade, remover, getSubtotal } = useCarrinhoStore();
  const { autenticado } = useContaClienteStore();

  if (!lojaId) return null;

  const handleQuantidade = (produtoId: string, quantidade: number) => {
    const resultado = actualizarQuantidade(produtoId, quantidade);
    if (!resultado.ok) {
      toast.error(`Apenas ${resultado.disponivel} disponível(is).`);
    }
  };

  const avancar = () => {
    navegar(autenticado ? `/loja/${lojaId}/checkout` : `/loja/${lojaId}/entrar`);
  };

  const totalItens = itens.reduce((acc, i) => acc + i.quantidade, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <LojaTopo lojaId={lojaId} />

      <div className="cc-caixa max-w-5xl py-8">
        <VoltarLink to={`/loja/${lojaId}`}>Voltar ao catálogo</VoltarLink>

        <h1 className="mb-6 text-2xl font-extrabold text-slate-900">O meu carrinho</h1>

        {itens.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <ShoppingBag size={26} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-600">O carrinho está vazio.</p>
            <p className="text-xs text-slate-400">Adicione produtos do catálogo para começar.</p>
            <Link
              to={`/loja/${lojaId}`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:shadow-md"
            >
              Ver o catálogo
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
            {/* Itens */}
            <div className="lg:col-span-2">
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
                {itens.map((item) => (
                  <div key={item.produtoId} className="flex items-center gap-4 p-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100">
                      {item.imagemUrl ? (
                        <img src={item.imagemUrl} alt={item.nome} className="h-full w-full object-cover" />
                      ) : (
                        <Package size={22} className="text-slate-300" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.nome}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {formatMoeda(item.precoVenda)} por {item.unidadeMedida.toLowerCase()}
                      </p>

                      <div className="mt-2.5 flex items-center gap-3">
                        <div className="flex items-center rounded-full border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleQuantidade(item.produtoId, item.quantidade - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-50"
                            aria-label={`Diminuir quantidade de ${item.nome}`}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-7 text-center text-sm font-medium">{item.quantidade}</span>
                          <button
                            type="button"
                            onClick={() => handleQuantidade(item.produtoId, item.quantidade + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-50"
                            aria-label={`Aumentar quantidade de ${item.nome}`}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => remover(item.produtoId)}
                          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 size={13} />
                          Remover
                        </button>
                      </div>
                    </div>

                    <p className="shrink-0 text-right text-sm font-bold text-blue-700">
                      {formatMoeda(item.precoVenda * item.quantidade)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo do pedido */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-4">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Resumo do pedido
                </h2>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>{totalItens} {totalItens === 1 ? 'artigo' : 'artigos'}</span>
                    <span>{formatMoeda(getSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Pagamento</span>
                    <span>No levantamento</span>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-semibold text-slate-900">Total</span>
                  <span className="text-2xl font-extrabold text-blue-700">{formatMoeda(getSubtotal())}</span>
                </div>

                <button
                  type="button"
                  onClick={avancar}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/30 transition-transform hover:scale-[1.02] hover:shadow-md"
                >
                  {autenticado ? 'Continuar para o checkout' : 'Entrar para continuar'}
                  <ArrowRight size={15} />
                </button>

                <p className="mt-3 text-center text-[11px] text-slate-400">
                  Não é cobrado agora — paga na loja, no momento do levantamento.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
