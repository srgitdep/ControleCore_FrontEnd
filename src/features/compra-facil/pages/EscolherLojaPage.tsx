import { Link } from 'react-router-dom';
import { Loader2, MapPin, Store } from 'lucide-react';
import { useLojasCommerce } from '../hooks/useCatalogoCommerce';

/**
 * A escolha da loja — o primeiro passo do Compra Fácil.
 *
 * O catálogo e o stock mostrados a seguir são sempre os de uma loja específica
 * (Docs/plano_compra_facil.md §4.3): não existe uma montra única com todas as lojas
 * misturadas, porque isso prometeria produtos que a loja escolhida pelo cliente pode
 * não ter.
 */
export function EscolherLojaPage() {
  const { data: lojas, isLoading, isError } = useLojasCommerce();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={22} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="cc-caixa py-16 text-center">
        <p className="text-sm text-slate-500">
          Não foi possível carregar as lojas. Tente novamente dentro de momentos.
        </p>
      </div>
    );
  }

  return (
    <div className="cc-caixa py-12">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Escolha a sua loja</h1>
        <p className="mt-1 text-sm text-slate-500">
          Os produtos e a disponibilidade são sempre os da loja que escolher.
        </p>
      </header>

      {lojas && lojas.length === 0 && (
        <p className="py-16 text-center text-sm text-slate-500">
          Ainda não há nenhuma loja com o Compra Fácil disponível.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lojas?.map((loja) => (
          <Link
            key={loja.id}
            to={`/loja/${loja.id}`}
            className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-600">
              <Store size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 group-hover:text-blue-700">
                {loja.nome}
              </p>
              {(loja.endereco || loja.cidade) && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={12} className="shrink-0" />
                  {[loja.endereco, loja.cidade].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
