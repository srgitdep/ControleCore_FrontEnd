import { Link, useNavigate, useParams } from 'react-router-dom';
import { Minus, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatMoeda } from '@/shared/utils';
import { useCarrinhoStore } from '../store/useCarrinhoStore';
import { useContaClienteStore } from '../store/useContaClienteStore';
import { LojaTopo } from '../components/LojaTopo';
import { VoltarLink } from '../components/VoltarLink';

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

  return (
    <div>
      <LojaTopo lojaId={lojaId} />

      <div className="cc-caixa max-w-2xl py-8">
        <VoltarLink to={`/loja/${lojaId}`}>Voltar ao catálogo</VoltarLink>

        <h1 className="mb-5 text-xl font-bold text-slate-900">O meu carrinho</h1>

        {itens.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-16 text-center">
            <ShoppingCart size={28} className="text-slate-300" />
            <p className="text-sm text-slate-500">O carrinho está vazio.</p>
            <Link to={`/loja/${lojaId}`} className="text-sm font-medium text-blue-600 hover:underline">
              Ver o catálogo
            </Link>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {itens.map((item) => (
                <div key={item.produtoId} className="flex items-center gap-3 p-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                    {item.imagemUrl ? (
                      <img src={item.imagemUrl} alt={item.nome} className="h-full w-full object-cover" />
                    ) : (
                      <Package size={20} className="text-slate-300" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{item.nome}</p>
                    <p className="text-xs text-slate-400">{formatMoeda(item.precoVenda)}</p>
                  </div>

                  <div className="flex items-center rounded-md border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleQuantidade(item.produtoId, item.quantidade - 1)}
                      className="flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-slate-50"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantidade}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantidade(item.produtoId, item.quantidade + 1)}
                      className="flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-slate-50"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <p className="w-20 shrink-0 text-right text-sm font-semibold text-slate-900">
                    {formatMoeda(item.precoVenda * item.quantidade)}
                  </p>

                  <button
                    type="button"
                    onClick={() => remover(item.produtoId)}
                    className="shrink-0 text-slate-300 hover:text-rose-500"
                    aria-label={`Remover ${item.nome}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
              <span className="text-sm font-medium text-slate-600">Total</span>
              <span className="text-xl font-bold text-slate-900">{formatMoeda(getSubtotal())}</span>
            </div>

            <button
              type="button"
              onClick={avancar}
              className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {autenticado ? 'Continuar para o checkout' : 'Entrar para continuar'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
