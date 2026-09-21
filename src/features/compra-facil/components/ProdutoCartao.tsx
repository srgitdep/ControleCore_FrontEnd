import { Link } from 'react-router-dom';
import { Package, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatMoeda } from '@/shared/utils';
import { useCarrinhoStore } from '../store/useCarrinhoStore';
import type { ProdutoLoja } from '../api/catalogo.api';

/**
 * O cartão de produto no catálogo.
 *
 * Produtos sem disponibilidade continuam a aparecer — como em qualquer catálogo de
 * supermercado — só desactivados, para o cliente saber que o produto existe em vez
 * de o catálogo parecer mais pequeno do que é.
 */
export function ProdutoCartao({ produto, lojaId }: { produto: ProdutoLoja; lojaId: string }) {
  const adicionar = useCarrinhoStore((s) => s.adicionar);

  const handleAdicionar = () => {
    const resultado = adicionar(lojaId, produto, 1);
    if (!resultado.ok) {
      toast.error(`${resultado.nome}: apenas ${resultado.disponivel} disponível(is).`);
      return;
    }
    toast.success(`${produto.nome} adicionado ao carrinho.`);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <Link to={`/loja/${lojaId}/produtos/${produto.id}`} className="block">
        <div className="flex aspect-square items-center justify-center bg-slate-50">
          {produto.imagemUrl ? (
            <img
              src={produto.imagemUrl}
              alt={produto.nome}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <Package size={36} className="text-slate-300" />
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {produto.categoria && (
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            {produto.categoria.nome}
          </p>
        )}
        <Link
          to={`/loja/${lojaId}/produtos/${produto.id}`}
          className="line-clamp-2 text-sm font-medium text-slate-900 hover:text-blue-700"
        >
          {produto.nome}
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="text-base font-bold text-slate-900">{formatMoeda(produto.precoVenda)}</p>
            <p className="text-[11px] text-slate-400">por {produto.unidadeMedida.toLowerCase()}</p>
          </div>

          <button
            type="button"
            onClick={handleAdicionar}
            disabled={!produto.disponivel}
            title={produto.disponivel ? 'Adicionar ao carrinho' : 'Sem stock nesta loja'}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            <Plus size={16} />
          </button>
        </div>

        {!produto.disponivel && (
          <p className="text-[11px] font-medium text-rose-500">Sem stock nesta loja</p>
        )}
      </div>
    </div>
  );
}
