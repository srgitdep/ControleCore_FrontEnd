import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, PackageSearch, Search, Store } from 'lucide-react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useCategoriasMercado, useProdutosMercado } from '../hooks/useCatalogoCommerce';
import { LojaListaLateral } from '../components/LojaListaLateral';
import { ProdutoCartao } from '../components/ProdutoCartao';
import { VoltarLink } from '../components/VoltarLink';

/**
 * A página inicial do Compra Fácil — um mercado, não uma escolha de loja.
 *
 * Antes, `/loja` era `EscolherLojaPage`: uma grelha de lojas, sem nenhum produto à
 * vista, e só depois de escolher uma é que se via o que ela vende. Isso é fricção que
 * nenhum marketplace tem — pediu-se explicitamente a lógica do AliExpress: pesquisa e
 * categoria no topo, lojas à esquerda, produtos ao centro, e o clique num produto leva
 * directamente à loja concreta onde ele está à venda
 * (Docs/plano_feature_marketplace_compra_facil.md).
 *
 * Não copia a linguagem visual do AliExpress (banners, carrosséis, badges de desconto)
 * — só a arquitectura de navegação. O Compra Fácil já tem identidade própria.
 */
export function LojaHomePage() {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<string | undefined>(undefined);
  const buscaComDebounce = useDebounce(busca, 300);

  const { data, isLoading, isError } = useProdutosMercado({
    search: buscaComDebounce || undefined,
    categoria,
    limit: 24,
  });
  const { data: categorias } = useCategoriasMercado();

  return (
    <div>
      <header className="border-b border-slate-200 bg-white">
        <div className="cc-caixa py-3">
          <VoltarLink to="/">Voltar ao início</VoltarLink>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/loja"
              className="flex shrink-0 items-center gap-2 text-lg font-bold text-slate-900"
            >
              <Store size={20} className="text-blue-600" />
              Compra Fácil
            </Link>

            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Pesquisar produtos em todas as lojas…"
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <select
              value={categoria ?? ''}
              onChange={(e) => setCategoria(e.target.value || undefined)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none sm:w-52"
            >
              <option value="">Todas as categorias</option>
              {categorias?.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="cc-caixa flex flex-col gap-6 py-6 md:flex-row">
        <LojaListaLateral />

        <div className="min-w-0 flex-1">
          {isLoading && (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader2 size={22} className="animate-spin text-slate-400" />
            </div>
          )}

          {isError && (
            <p className="py-16 text-center text-sm text-slate-500">
              Não foi possível carregar os produtos. Tente novamente dentro de momentos.
            </p>
          )}

          {data && data.data.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <PackageSearch size={28} className="text-slate-300" />
              <p className="text-sm text-slate-500">
                {busca || categoria
                  ? 'Sem resultados para esta pesquisa.'
                  : 'Ainda não há produtos publicados no sistema.'}
              </p>
            </div>
          )}

          {data && data.data.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {data.data.map((produto) => (
                <ProdutoCartao
                  key={`${produto.lojaId}-${produto.id}`}
                  produto={produto}
                  lojaId={produto.lojaId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
