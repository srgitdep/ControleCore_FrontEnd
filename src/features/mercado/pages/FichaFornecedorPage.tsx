import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Globe,
  Loader2,
  MapPin,
  Package,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react';
import { ETIQUETA_DOCUMENTO_PUBLICO, mercado } from '../api/mercado.api';

/**
 * A ficha pública de um fornecedor.
 *
 * ## Os documentos listados já valem hoje
 *
 * O backend filtra pelos que ainda estão na validade. Um alvará verificado em Janeiro e
 * expirado em Junho numa ficha pública é pior do que nenhum: dá confiança sem a justificar,
 * e quem a lê não tem como saber.
 *
 * ## O número de compradores pode não aparecer, e isso não é um erro
 *
 * Abaixo de cinco compradores distintos o backend devolve nulo, por anonimato — «este
 * fornecedor tem um cliente» mais o contexto de quem lê chega para identificar quem é, e esta
 * página é pública. O ecrã tem de dizer «não divulgado» e nunca «0», que seria falso.
 */
export function FichaFornecedorPage() {
  const { organizacaoId } = useParams<{ organizacaoId: string }>();

  const { data: ficha, isLoading, isError } = useQuery({
    queryKey: ['mercado-ficha', organizacaoId],
    queryFn: () => mercado.ficha(organizacaoId!),
    enabled: !!organizacaoId,
    retry: false,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/mercado"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={15} />
            Mercado
          </Link>
          <Link
            to="/fornecedor/registar"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Sou fornecedor
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={22} className="animate-spin text-slate-400" />
          </div>
        ) : isError || !ficha ? (
          <div className="rounded-lg border border-dashed border-slate-300 py-16 text-center">
            <Building2 size={26} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm text-slate-600">Fornecedor não encontrado.</p>
            <Link to="/mercado" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
              Voltar ao mercado
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Store size={20} className="text-slate-500" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-semibold text-slate-900">
                    {ficha.nomeComercial ?? ficha.razaoSocial}
                  </h1>
                  {ficha.nomeComercial && ficha.nomeComercial !== ficha.razaoSocial && (
                    <p className="text-sm text-slate-500">{ficha.razaoSocial}</p>
                  )}

                  <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    {ficha.sede && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} />
                        {ficha.sede}
                      </span>
                    )}
                    {ficha.website && (
                      <a
                        href={
                          ficha.website.startsWith('http')
                            ? ficha.website
                            : `https://${ficha.website}`
                        }
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Globe size={12} />
                        {ficha.website}
                      </a>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Indicador
                icone={Package}
                valor={String(ficha.artigosPublicados)}
                etiqueta={`artigo${ficha.artigosPublicados === 1 ? '' : 's'} publicado${ficha.artigosPublicados === 1 ? '' : 's'}`}
              />
              <Indicador
                icone={MapPin}
                valor={String(ficha.provinciasServidas.length)}
                etiqueta={`província${ficha.provinciasServidas.length === 1 ? '' : 's'} servida${ficha.provinciasServidas.length === 1 ? '' : 's'}`}
              />
              <Indicador
                icone={Users}
                valor={ficha.compradoresActivos !== null ? String(ficha.compradoresActivos) : '—'}
                etiqueta="compradores activos"
                // A distinção entre «não divulgado» e «nenhum» é a razão de este campo
                // poder vir nulo. Um «0» aqui seria uma afirmação falsa.
                nota={
                  ficha.compradoresActivos === null
                    ? 'Não divulgado — abaixo de cinco compradores o número não é publicado, por anonimato.'
                    : undefined
                }
              />
            </div>

            {ficha.documentosValidos.length > 0 && (
              <section className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-emerald-900">
                  <ShieldCheck size={15} />
                  Documentação verificada
                </h2>
                <p className="mt-0.5 text-[11px] leading-snug text-emerald-800">
                  Verificada pela plataforma e dentro da validade nesta data.
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {ficha.documentosValidos.map((tipo) => (
                    <li
                      key={tipo}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-emerald-800"
                    >
                      <CheckCircle2 size={11} />
                      {ETIQUETA_DOCUMENTO_PUBLICO[tipo] ?? tipo}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {ficha.categorias.length > 0 && (
              <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-slate-900">O que fornece</h2>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {ficha.categorias.map((categoria) => (
                    <li
                      key={categoria}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                    >
                      {categoria}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {ficha.provinciasServidas.length > 0 && (
              <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-slate-900">Onde entrega</h2>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {ficha.provinciasServidas.map((provincia) => (
                    <li
                      key={provincia}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                    >
                      <MapPin size={11} className="text-slate-400" />
                      {provincia}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-center">
              <p className="text-sm font-medium text-blue-900">
                Quer comprar a este fornecedor?
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs leading-snug text-blue-800">
                No ControlCore, cria uma requisição com o que precisa e o sistema compara este
                fornecedor com todos os outros — preço por unidade, prazo, fiabilidade e custo
                de entrega — e diz-lhe qual sai melhor, e porquê.
              </p>
              <Link
                to="/login"
                className="mt-3 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Entrar no ControlCore
              </Link>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Indicador({
  icone: Icone,
  valor,
  etiqueta,
  nota,
}: {
  icone: typeof Package;
  valor: string;
  etiqueta: string;
  nota?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4" title={nota}>
      <Icone size={15} className="text-slate-400" />
      <p className="mt-1.5 text-xl font-semibold text-slate-900">{valor}</p>
      <p className="text-xs text-slate-500">{etiqueta}</p>
      {nota && <p className="mt-1 text-[10px] leading-snug text-slate-400">{nota}</p>}
    </div>
  );
}
