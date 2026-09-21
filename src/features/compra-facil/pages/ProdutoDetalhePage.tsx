import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, Minus, Package, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatMoeda } from '@/shared/utils';
import { useProdutoLoja } from '../hooks/useCatalogoCommerce';
import { useCarrinhoStore } from '../store/useCarrinhoStore';
import { LojaTopo } from '../components/LojaTopo';

export function ProdutoDetalhePage() {
  const { lojaId, produtoId } = useParams<{ lojaId: string; produtoId: string }>();
  const { data: produto, isLoading, isError } = useProdutoLoja(lojaId, produtoId);
  const adicionar = useCarrinhoStore((s) => s.adicionar);
  const [quantidade, setQuantidade] = useState(1);

  if (!lojaId || !produtoId) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={22} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError || !produto) {
    return (
      <div className="cc-caixa py-16 text-center">
        <p className="text-sm text-slate-500">Produto não encontrado nesta loja.</p>
        <Link to={`/loja/${lojaId}`} className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  const handleAdicionar = () => {
    const resultado = adicionar(lojaId, produto, quantidade);
    if (!resultado.ok) {
      toast.error(`Apenas ${resultado.disponivel} disponível(is).`);
      return;
    }
    toast.success(`${produto.nome} adicionado ao carrinho.`);
    setQuantidade(1);
  };

  const imagemPrincipal = produto.imagens.find((i) => i.isPrincipal)?.url ?? produto.imagemUrl;

  return (
    <div>
      <LojaTopo lojaId={lojaId} />

      <div className="cc-caixa py-8">
        <Link to={`/loja/${lojaId}`} className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700">
          ← Voltar ao catálogo
        </Link>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-slate-50">
            {imagemPrincipal ? (
              <img src={imagemPrincipal} alt={produto.nome} className="h-full w-full object-cover" />
            ) : (
              <Package size={64} className="text-slate-300" />
            )}
          </div>

          <div>
            {produto.categoria && (
              <p className="text-xs uppercase tracking-wide text-slate-400">{produto.categoria.nome}</p>
            )}
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{produto.nome}</h1>
            <p className="mt-3 text-3xl font-bold text-slate-900">{formatMoeda(produto.precoVenda)}</p>
            <p className="text-sm text-slate-400">por {produto.unidadeMedida.toLowerCase()}</p>

            {produto.descricao && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {produto.descricao}
              </p>
            )}

            <div className="mt-6">
              {produto.disponivel ? (
                <>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex items-center rounded-lg border border-slate-300">
                      <button
                        type="button"
                        onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                        className="flex h-10 w-10 items-center justify-center text-slate-600 hover:bg-slate-50"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{quantidade}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantidade((q) => Math.min(produto.quantidadeDisponivel, q + 1))
                        }
                        className="flex h-10 w-10 items-center justify-center text-slate-600 hover:bg-slate-50"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">
                      {produto.quantidadeDisponivel} disponível(is)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAdicionar}
                    className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Adicionar ao carrinho
                  </button>
                </>
              ) : (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  Sem stock nesta loja de momento.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
