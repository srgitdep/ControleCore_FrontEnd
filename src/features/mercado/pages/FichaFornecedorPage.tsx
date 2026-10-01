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
import { useTranslation } from 'react-i18next';
import { TIPOS_DOCUMENTO_PUBLICO, mercado } from '../api/mercado.api';
import { SelectorIdioma } from '@/shared/ui';

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
  const { t } = useTranslation('mercado');
  const { organizacaoId } = useParams<{ organizacaoId: string }>();

  // O tipo vem do servidor como texto livre: um tipo desconhecido mostra-se tal como chegou.
  const etiqueta = (tipo: string) =>
    (TIPOS_DOCUMENTO_PUBLICO as readonly string[]).includes(tipo)
      ? t(`documento.${tipo as (typeof TIPOS_DOCUMENTO_PUBLICO)[number]}`)
      : tipo;

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
            {t('ficha.voltar')}
          </Link>
          <div className="flex items-center gap-2">
            <SelectorIdioma />
            <Link
              to="/fornecedor/registar"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {t('cabecalho.sou_fornecedor')}
            </Link>
          </div>
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
            <p className="mt-2 text-sm text-slate-600">{t('ficha.nao_encontrado')}</p>
            <Link to="/mercado" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
              {t('ficha.voltar_ao_mercado')}
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
                etiqueta={t('ficha.artigos_publicados', { count: ficha.artigosPublicados })}
              />
              <Indicador
                icone={MapPin}
                valor={String(ficha.provinciasServidas.length)}
                etiqueta={t('ficha.provincias_servidas', { count: ficha.provinciasServidas.length })}
              />
              <Indicador
                icone={Users}
                valor={ficha.compradoresActivos !== null ? String(ficha.compradoresActivos) : '—'}
                etiqueta={t('ficha.compradores_activos')}
                // A distinção entre «não divulgado» e «nenhum» é a razão de este campo
                // poder vir nulo. Um «0» aqui seria uma afirmação falsa.
                nota={
                  ficha.compradoresActivos === null
                    ? t('ficha.compradores_nota')
                    : undefined
                }
              />
            </div>

            {ficha.documentosValidos.length > 0 && (
              <section className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-emerald-900">
                  <ShieldCheck size={15} />
                  {t('ficha.documentacao_titulo')}
                </h2>
                <p className="mt-0.5 text-[11px] leading-snug text-emerald-800">
                  {t('ficha.documentacao_texto')}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {ficha.documentosValidos.map((tipo) => (
                    <li
                      key={tipo}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-emerald-800"
                    >
                      <CheckCircle2 size={11} />
                      {etiqueta(tipo)}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {ficha.categorias.length > 0 && (
              <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-slate-900">{t('ficha.o_que_fornece')}</h2>
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
                <h2 className="text-sm font-semibold text-slate-900">{t('ficha.onde_entrega')}</h2>
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
                {t('ficha.cta_titulo')}
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs leading-snug text-blue-800">
                {t('ficha.cta_texto')}
              </p>
              <Link
                to="/login"
                className="mt-3 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {t('ficha.entrar')}
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
