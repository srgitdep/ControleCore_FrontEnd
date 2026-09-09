import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  Loader2,
  MapPin,
  Package,
  Search,
  Store,
} from 'lucide-react';
import { PROVINCIAS_MERCADO, mercado } from '../api/mercado.api';
import { useDebounce } from '@/shared/hooks';
import { cn } from '@/shared/utils';

const mt = (v: number) =>
  `${v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;

/**
 * O directório público de fornecedores.
 *
 * ## Porque esta página existe
 *
 * É o motor de aquisição: quem entra a comparar fornecedores sai a experimentar o
 * ControlCore. Um mercado B2B sem espaço público só cresce à velocidade das vendas do lado
 * comprador — e o efeito de rede, que é o valor todo da funcionalidade, nunca arranca.
 *
 * ## O que não aparece aqui
 *
 * Nada de nenhuma empresa compradora: nem preços negociados, nem nomes de clientes, nem
 * requisições, nem pontuações de sourcing. A fronteira está no backend —
 * `ICatalogoPublicoRepository` não tem um único método que aceite `empresaId` — e esta
 * página só consegue chamar isso.
 *
 * Os preços que mostra são os de tabela que o próprio fornecedor publicou para serem vistos.
 */
export function MercadoPage() {
  const [parametros, setParametros] = useSearchParams();

  // O estado vive no URL e não no componente. Uma busca no mercado é para ser partilhada —
  // «olha este fornecedor» — e um estado local perdia-se ao recarregar.
  const [termo, setTermo] = useState(parametros.get('termo') ?? '');
  const provincia = parametros.get('provincia') ?? '';

  const termoAtrasado = useDebounce(termo, 400);

  const { data: fornecedores, isFetching } = useQuery({
    queryKey: ['mercado', termoAtrasado, provincia],
    queryFn: () =>
      mercado.procurar({
        termo: termoAtrasado.trim() || undefined,
        provincia: provincia || undefined,
        limite: 30,
      }),
  });

  const actualizarUrl = (chave: string, valor: string) => {
    const novos = new URLSearchParams(parametros);
    if (valor) novos.set(chave, valor);
    else novos.delete(chave);
    setParametros(novos, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/mercado" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Store size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-slate-900">
                Mercado de Fornecedores
              </p>
              <p className="text-xs leading-tight text-slate-500">SRG ControlCore</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/fornecedor/registar"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Sou fornecedor
            </Link>
            <Link
              to="/login"
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-5">
          <h1 className="text-lg font-semibold text-slate-900">
            Quem fornece o quê, e onde entrega
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Fornecedores com catálogo publicado na plataforma. Os preços são os de tabela que
            cada um publicou.
          </p>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={termo}
              onChange={(e) => {
                setTermo(e.target.value);
                actualizarUrl('termo', e.target.value);
              }}
              placeholder="Arroz, óleo, detergente, bebidas…"
              className="w-full rounded-md border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"
            />
            {isFetching && (
              <Loader2
                size={15}
                className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
              />
            )}
          </div>

          <select
            value={provincia}
            onChange={(e) => actualizarUrl('provincia', e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Todas as províncias</option>
            {PROVINCIAS_MERCADO.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {!fornecedores ? (
          <div className="flex justify-center py-20">
            <Loader2 size={22} className="animate-spin text-slate-400" />
          </div>
        ) : fornecedores.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 py-16 text-center">
            <Building2 size={26} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm text-slate-600">
              {termoAtrasado || provincia
                ? 'Nenhum fornecedor com esses critérios.'
                : 'Ainda não há fornecedores com catálogo publicado.'}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-snug text-slate-500">
              {termoAtrasado || provincia
                ? 'Tente um termo mais geral, ou remova o filtro de província.'
                : 'O mercado cresce com quem publica. Se fornece a supermercados, registe-se — não paga nada.'}
            </p>
            <Link
              to="/fornecedor/registar"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
            >
              Registar a minha empresa
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-2 text-xs text-slate-500">
              {fornecedores.length} fornecedor{fornecedores.length === 1 ? '' : 'es'}
              {provincia ? ` a entregar em ${provincia}` : ''}
            </p>

            <ul className="space-y-3">
              {fornecedores.map((f) => (
                <li
                  key={f.organizacaoId}
                  className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/mercado/fornecedores/${f.organizacaoId}`}
                        className="text-sm font-semibold text-slate-900 hover:text-blue-700 hover:underline"
                      >
                        {f.nomeComercial ?? f.razaoSocial}
                      </Link>
                      {f.nomeComercial && f.nomeComercial !== f.razaoSocial && (
                        <p className="text-xs text-slate-500">{f.razaoSocial}</p>
                      )}

                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Package size={11} />
                          {f.artigosPublicados} artigo{f.artigosPublicados === 1 ? '' : 's'}
                        </span>
                        {f.provinciasServidas.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={11} />
                            {f.provinciasServidas.slice(0, 3).join(', ')}
                            {f.provinciasServidas.length > 3 &&
                              ` +${f.provinciasServidas.length - 3}`}
                          </span>
                        )}
                      </p>
                    </div>

                    <Link
                      to={`/mercado/fornecedores/${f.organizacaoId}`}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Ver ficha
                      <ArrowRight size={13} />
                    </Link>
                  </div>

                  {f.amostra.length > 0 && (
                    <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100 pt-2">
                      {f.amostra.map((artigo) => (
                        <li
                          key={artigo.id}
                          className="flex flex-wrap items-baseline justify-between gap-2 py-1.5"
                        >
                          <span className="min-w-0 text-xs text-slate-700">
                            {artigo.nome}
                            {artigo.unidadeVenda && (
                              <span className="ml-1.5 text-slate-400">
                                / {artigo.unidadeVenda}
                              </span>
                            )}
                          </span>
                          <span
                            className={cn(
                              'shrink-0 text-xs',
                              artigo.precoBase !== null
                                ? 'font-medium text-slate-900'
                                : 'text-slate-400',
                            )}
                          >
                            {/* «Sob consulta» e não «0»: o fornecedor pode publicar o artigo
                                sem publicar preço, e um zero leria-se como grátis. */}
                            {artigo.precoBase !== null ? mt(artigo.precoBase) : 'sob consulta'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        <footer className="mt-10 border-t border-slate-200 pt-5 text-center">
          <p className="text-sm font-medium text-slate-700">Fornece a supermercados?</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-snug text-slate-500">
            Publique o seu catálogo uma vez e fique visível a todos os compradores da
            plataforma. O registo é gratuito.
          </p>
          <Link
            to="/fornecedor/registar"
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Registar a minha empresa
            <ArrowRight size={15} />
          </Link>
        </footer>
      </main>
    </div>
  );
}
