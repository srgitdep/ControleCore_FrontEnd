import { Link } from 'react-router-dom';
import { History, MapPin, Store } from 'lucide-react';
import { useLojasCommerce, useLojasCompradas } from '../hooks/useCatalogoCommerce';

/** Iniciais para o avatar da loja — as duas primeiras palavras, ou as duas primeiras letras. */
function iniciaisDaLoja(nome: string): string {
  const palavras = nome.trim().split(/\s+/).filter(Boolean);
  if (palavras.length >= 2) return (palavras[0][0] + palavras[1][0]).toUpperCase();
  return nome.slice(0, 2).toUpperCase();
}

/**
 * A barra lateral do mercado: lojas onde o cliente já comprou (só quando autenticado)
 * e todas as lojas do sistema — Docs/plano_feature_marketplace_compra_facil.md.
 *
 * Em ecrã largo é a coluna esquerda clássica; em telemóvel cada secção passa a uma
 * lista de "pills" que quebra linha, em vez de obrigar a uma coluna fixa estreita — o
 * Compra Fácil corre em telemóvel, e uma barra lateral rígida não podia ser a única
 * forma de mudar de loja num ecrã pequeno.
 */
export function LojaListaLateral() {
  const { data: lojas, isLoading } = useLojasCommerce();
  const { data: lojasCompradas } = useLojasCompradas();

  return (
    <aside className="w-full shrink-0 md:w-64">
      {lojasCompradas && lojasCompradas.length > 0 && (
        <div className="mb-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-blue-700">
            <History size={13} />
            As minhas lojas
          </p>
          <ul className="flex flex-wrap gap-1.5 md:flex-col md:flex-nowrap md:gap-1">
            {lojasCompradas.map((loja) => (
              <li key={loja.lojaId}>
                <Link
                  to={`/loja/${loja.lojaId}`}
                  className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-blue-700 shadow-sm hover:shadow md:rounded-lg md:px-2.5 md:py-2 md:shadow-none md:hover:bg-white/80"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                    {iniciaisDaLoja(loja.lojaNome)}
                  </span>
                  <span className="truncate">{loja.lojaNome}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
          <Store size={13} />
          Todas as lojas
        </p>

        {isLoading && <p className="px-1 text-sm text-slate-400">A carregar…</p>}

        <ul className="flex flex-wrap gap-1.5 md:flex-col md:flex-nowrap md:gap-1.5">
          {lojas?.map((loja) => (
            <li key={loja.id}>
              <Link
                to={`/loja/${loja.id}`}
                className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50/50 md:rounded-xl md:border md:px-2.5 md:py-2"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-[10px] font-bold text-white">
                  {iniciaisDaLoja(loja.nome)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{loja.nome}</span>
                  {(loja.endereco || loja.cidade) && (
                    <span className="hidden items-center gap-1 text-xs text-slate-400 md:flex">
                      <MapPin size={10} className="shrink-0" />
                      <span className="truncate">
                        {[loja.endereco, loja.cidade].filter(Boolean).join(', ')}
                      </span>
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
