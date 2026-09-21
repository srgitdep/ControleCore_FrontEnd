import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, PackageSearch } from 'lucide-react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useProdutosLoja } from '../hooks/useCatalogoCommerce';
import { LojaTopo } from '../components/LojaTopo';
import { ProdutoCartao } from '../components/ProdutoCartao';
import { VoltarLink } from '../components/VoltarLink';

/** O catálogo de uma loja: pesquisa e grelha de produtos, com disponibilidade real. */
export function CatalogoPage() {
  const { lojaId } = useParams<{ lojaId: string }>();
  const [busca, setBusca] = useState('');
  const buscaComDebounce = useDebounce(busca, 300);

  const { data, isLoading, isError } = useProdutosLoja(lojaId, {
    search: buscaComDebounce || undefined,
    limit: 60,
  });

  if (!lojaId) return null;

  return (
    <div>
      <LojaTopo lojaId={lojaId} busca={busca} onBuscaChange={setBusca} />

      <div className="cc-caixa py-6">
        <VoltarLink to="/loja">Trocar de loja</VoltarLink>

        {isLoading && (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 size={22} className="animate-spin text-slate-400" />
          </div>
        )}

        {isError && (
          <p className="py-16 text-center text-sm text-slate-500">
            Não foi possível carregar o catálogo. Tente novamente dentro de momentos.
          </p>
        )}

        {data && data.data.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <PackageSearch size={28} className="text-slate-300" />
            <p className="text-sm text-slate-500">
              {busca ? `Sem resultados para "${busca}".` : 'Esta loja ainda não tem produtos publicados.'}
            </p>
          </div>
        )}

        {data && data.data.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {data.data.map((produto) => (
              <ProdutoCartao key={produto.id} produto={produto} lojaId={lojaId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
