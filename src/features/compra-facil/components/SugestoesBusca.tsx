import { Link } from 'react-router-dom';
import { Loader2, Package, Search } from 'lucide-react';
import { formatMoeda } from '@/shared/utils';

export interface SugestaoProduto {
  id: string;
  nome: string;
  precoVenda: number;
  imagemUrl: string | null;
  lojaId: string;
}

interface SugestoesBuscaProps {
  aberto: boolean;
  aCarregar: boolean;
  termo: string;
  sugestoes: SugestaoProduto[];
  onEscolher: () => void;
}

/**
 * O painel de sugestões debaixo do campo de pesquisa — reaproveita o mesmo endpoint
 * dos resultados (com `limit` pequeno), sem rota nova. Fecha-se com `onBlur` do input
 * que o chama (ver `LojaHomePage`/`LojaTopo`), não sozinho — um painel que se fecha ao
 * clicar dentro de si mesmo nunca deixaria seleccionar uma sugestão.
 */
export function SugestoesBusca({ aberto, aCarregar, termo, sugestoes, onEscolher }: SugestoesBuscaProps) {
  if (!aberto || termo.trim().length < 2) return null;

  return (
    <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      {aCarregar && (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-400">
          <Loader2 size={14} className="animate-spin" />
          A procurar…
        </div>
      )}

      {!aCarregar && sugestoes.length === 0 && (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-400">
          <Search size={14} />
          Sem resultados para "{termo}".
        </div>
      )}

      {!aCarregar &&
        sugestoes.map((produto) => (
          <Link
            key={`${produto.lojaId}-${produto.id}`}
            to={`/loja/${produto.lojaId}/produtos/${produto.id}`}
            onMouseDown={onEscolher}
            className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-left last:border-0 hover:bg-blue-50/60"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
              {produto.imagemUrl ? (
                <img src={produto.imagemUrl} alt={produto.nome} className="h-full w-full object-cover" />
              ) : (
                <Package size={16} className="text-slate-300" />
              )}
            </div>
            <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{produto.nome}</span>
            <span className="shrink-0 text-sm font-semibold text-blue-700">
              {formatMoeda(produto.precoVenda)}
            </span>
          </Link>
        ))}
    </div>
  );
}
