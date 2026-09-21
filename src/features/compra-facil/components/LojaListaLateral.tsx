import { Link } from 'react-router-dom';
import { History, MapPin, Store } from 'lucide-react';
import { useLojasCommerce, useLojasCompradas } from '../hooks/useCatalogoCommerce';

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
    <aside className="w-full shrink-0 md:w-60">
      {lojasCompradas && lojasCompradas.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <History size={13} />
            As minhas lojas
          </p>
          <ul className="flex flex-wrap gap-1.5 md:flex-col md:flex-nowrap md:gap-1">
            {lojasCompradas.map((loja) => (
              <li key={loja.lojaId}>
                <Link
                  to={`/loja/${loja.lojaId}`}
                  className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 md:rounded-lg md:border-0 md:bg-transparent md:px-2.5 md:py-2 md:text-slate-700 md:hover:bg-slate-100"
                >
                  <Store size={14} className="shrink-0" />
                  <span className="truncate">{loja.lojaNome}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Todas as lojas
        </p>

        {isLoading && <p className="px-1 text-sm text-slate-400">A carregar…</p>}

        <ul className="flex flex-wrap gap-1.5 md:flex-col md:flex-nowrap md:gap-1">
          {lojas?.map((loja) => (
            <li key={loja.id}>
              <Link
                to={`/loja/${loja.id}`}
                className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:border-blue-300 hover:bg-blue-50/40 md:items-start md:rounded-lg md:border-0 md:px-2.5 md:py-2 md:hover:bg-slate-100"
              >
                <Store size={14} className="shrink-0 text-slate-400 md:mt-0.5" />
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
