import { Link } from 'react-router-dom';
import { Package, Plus, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatMoeda } from '@/shared/utils';
import { useCarrinhoStore } from '../store/useCarrinhoStore';
import { corDaCategoria } from '../utils/corCategoria';
import type { ProdutoLoja } from '../api/catalogo.api';

interface ProdutoCartaoProps {
  produto: ProdutoLoja;
  lojaId: string;
  /** Só passado no mercado (produtos de várias lojas) — redundante dentro de uma loja só. */
  lojaNome?: string;
}

/**
 * O cartão de produto — catálogo de uma loja e mercado entre lojas.
 *
 * Produtos sem disponibilidade continuam a aparecer — como em qualquer catálogo de
 * supermercado — só desactivados, para o cliente saber que o produto existe em vez
 * de o catálogo parecer mais pequeno do que é.
 */
export function ProdutoCartao({ produto, lojaId, lojaNome }: ProdutoCartaoProps) {
  const adicionar = useCarrinhoStore((s) => s.adicionar);
  const cor = produto.categoria ? corDaCategoria(produto.categoria.nome) : null;

  const handleAdicionar = () => {
    const resultado = adicionar(lojaId, produto, 1);
    if (!resultado.ok) {
      toast.error(`${resultado.nome}: apenas ${resultado.disponivel} disponível(is).`);
      return;
    }
    toast.success(`${produto.nome} adicionado ao carrinho.`);
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200">
      <Link to={`/loja/${lojaId}/produtos/${produto.id}`} className="relative block">
        <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          {produto.imagemUrl ? (
            <img
              src={produto.imagemUrl}
              alt={produto.nome}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <Package size={36} className="text-slate-300" />
          )}
        </div>

        {cor && (
          <span
            className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cor.chip}`}
          >
            {produto.categoria!.nome}
          </span>
        )}

        {!produto.disponivel && (
          <span className="absolute right-2 top-2 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white">
            Esgotado
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {lojaNome && (
          <Link
            to={`/loja/${lojaId}`}
            className="inline-flex w-fit items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline"
          >
            <Store size={11} />
            {lojaNome}
          </Link>
        )}

        <Link
          to={`/loja/${lojaId}/produtos/${produto.id}`}
          className="line-clamp-2 text-sm font-medium text-slate-900 hover:text-blue-700"
        >
          {produto.nome}
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="text-lg font-extrabold text-blue-700">{formatMoeda(produto.precoVenda)}</p>
            <p className="text-[11px] text-slate-400">por {produto.unidadeMedida.toLowerCase()}</p>
          </div>

          <button
            type="button"
            onClick={handleAdicionar}
            disabled={!produto.disponivel}
            title={produto.disponivel ? 'Adicionar ao carrinho' : 'Sem stock nesta loja'}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-sm shadow-blue-600/30 transition-transform hover:scale-110 hover:shadow-md disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:hover:scale-100"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
