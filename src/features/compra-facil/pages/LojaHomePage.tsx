import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, LogOut, PackageSearch, Search, ShoppingCart, Sparkles, UserCircle2 } from 'lucide-react';
import { cn } from '@/shared/utils';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useCategoriasMercado, useLojasCommerce, useProdutosMercado } from '../hooks/useCatalogoCommerce';
import { useCarrinhoStore } from '../store/useCarrinhoStore';
import { useContaClienteStore } from '../store/useContaClienteStore';
import { LojaListaLateral } from '../components/LojaListaLateral';
import { ProdutoCartao } from '../components/ProdutoCartao';
import { VoltarLink } from '../components/VoltarLink';
import { SugestoesBusca } from '../components/SugestoesBusca';
import { corDaCategoria } from '../utils/corCategoria';

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
 * O hero em gradiente e os chips de categoria a cores (em vez de um `<select>` plano)
 * vieram de um pedido explícito de "menos estático, mais cor" — não é decoração à
 * toa: é o que separa uma lista de uma montra.
 */
export function LojaHomePage() {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<string | undefined>(undefined);
  const [buscaFocada, setBuscaFocada] = useState(false);
  const buscaComDebounce = useDebounce(busca, 300);

  const { data, isLoading, isError } = useProdutosMercado({
    search: buscaComDebounce || undefined,
    categoria,
    limit: 24,
  });

  // As sugestões reaproveitam o mesmo endpoint, só com um `limit` pequeno — sem rota
  // nova. `enabled` evita disparar com um termo demasiado curto para dizer alguma coisa.
  const termoSugestoes = buscaComDebounce.trim();
  const { data: sugestoesData, isFetching: aCarregarSugestoes } = useProdutosMercado(
    { search: termoSugestoes, limit: 6 },
    { enabled: buscaFocada && termoSugestoes.length >= 2 },
  );

  const { data: categorias } = useCategoriasMercado();
  const { data: lojas } = useLojasCommerce();

  const totalItensCarrinho = useCarrinhoStore((s) => s.itens.reduce((acc, i) => acc + i.quantidade, 0));
  const carrinhoLojaId = useCarrinhoStore((s) => s.lojaId);
  const { autenticado, cliente, sair } = useContaClienteStore();

  // Sem escolher uma loja ainda, "Entrar"/"Criar conta" tem de apontar para alguma —
  // a conta é sempre de uma empresa concreta (ContaCliente.empresaId). Usa-se a
  // primeira loja da lista (a mesma ordem alfabética de `listarLojas`) como destino
  // por omissão: entrar por aqui continua a funcionar, mesmo sem o cliente ainda ter
  // escolhido em que loja quer comprar.
  const primeiraLoja = lojas?.[0];

  return (
    <div className="bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="cc-caixa py-3">
          <VoltarLink to="/">Voltar ao início</VoltarLink>
        </div>
      </div>

      {/* O hero: fundo em gradiente com a pesquisa dentro, em vez de uma barra branca
          fina — é a primeira coisa que se vê ao entrar no Compra Fácil. */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 pb-9 pt-7 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl"
        />

        <div className="cc-caixa relative">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-100">
              <Sparkles size={13} />
              Compra Fácil
            </p>

            <div className="flex items-center gap-2">
              {carrinhoLojaId ? (
                <Link
                  to={`/loja/${carrinhoLojaId}/carrinho`}
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                  title="O meu carrinho"
                >
                  <ShoppingCart size={16} />
                  {totalItensCarrinho > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                      {totalItensCarrinho}
                    </span>
                  )}
                </Link>
              ) : (
                <span
                  title="O carrinho aparece assim que adicionar um produto"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/50"
                >
                  <ShoppingCart size={16} />
                </span>
              )}

              {autenticado ? (
                <button
                  type="button"
                  onClick={() => void sair()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/25"
                  title={cliente?.nome}
                >
                  <UserCircle2 size={14} />
                  <span className="hidden sm:inline">{cliente?.nome?.split(' ')[0]}</span>
                  <LogOut size={13} />
                </button>
              ) : (
                primeiraLoja && (
                  <>
                    <Link
                      to={`/loja/${primeiraLoja.id}/entrar`}
                      className="hidden rounded-full px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15 sm:inline-flex sm:items-center"
                    >
                      Entrar
                    </Link>
                    <Link
                      to={`/loja/${primeiraLoja.id}/criar-conta`}
                      className="inline-flex items-center rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50"
                    >
                      Criar conta
                    </Link>
                  </>
                )
              )}
            </div>
          </div>

          <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">
            Encontre tudo o que precisa
          </h1>
          <p className="mt-1 text-sm text-blue-100">
            Produtos de todas as lojas do sistema, num único sítio.
          </p>

          <div className="relative mt-5 max-w-xl">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onFocus={() => setBuscaFocada(true)}
              onBlur={() => setTimeout(() => setBuscaFocada(false), 120)}
              placeholder="Pesquisar produtos…"
              className="w-full rounded-full border-0 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 shadow-lg shadow-blue-900/25 focus:outline-none focus:ring-2 focus:ring-white"
            />

            <SugestoesBusca
              aberto={buscaFocada}
              aCarregar={aCarregarSugestoes}
              termo={termoSugestoes}
              sugestoes={sugestoesData?.data ?? []}
              onEscolher={() => setBuscaFocada(false)}
            />
          </div>
        </div>
      </div>

      {/* Categorias como chips de cor, não um `<select>` — cada uma com a sua cor
          (`corDaCategoria`), para a fila ler-se como filtros vivos. */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="cc-caixa flex gap-2 overflow-x-auto py-3">
          <button
            type="button"
            onClick={() => setCategoria(undefined)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
              !categoria ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            Todas as categorias
          </button>

          {categorias?.map((nome) => {
            const activa = categoria === nome;
            const cor = corDaCategoria(nome);
            return (
              <button
                key={nome}
                type="button"
                onClick={() => setCategoria(activa ? undefined : nome)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                  activa ? `${cor.activo} text-white` : `${cor.chip} hover:opacity-80`,
                )}
              >
                {nome}
              </button>
            );
          })}
        </div>
      </div>

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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {data.data.map((produto) => (
                <ProdutoCartao
                  key={`${produto.lojaId}-${produto.id}`}
                  produto={produto}
                  lojaId={produto.lojaId}
                  lojaNome={produto.lojaNome}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
