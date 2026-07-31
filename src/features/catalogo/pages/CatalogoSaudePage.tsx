import { Link } from 'react-router-dom';
import { Activity, Package, Tags, FolderTree, Award, Store } from 'lucide-react';
import { useSaudeCatalogo } from '../hooks/useCatalogo';

export function CatalogoSaudePage() {
  const saude = useSaudeCatalogo();
  const t = saude.data?.totais;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Activity className="h-6 w-6 text-emerald-600" />
            Saúde do catálogo
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Completude das fichas e lacunas operacionais (CAT-43).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/catalogo/artigos"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Package className="h-4 w-4" /> Artigos
          </Link>
          <Link
            to="/catalogo/familias"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <FolderTree className="h-4 w-4" /> Famílias
          </Link>
          <Link
            to="/catalogo/marcas"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Award className="h-4 w-4" /> Marcas
          </Link>
          <Link
            to="/catalogo/sortidos"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Store className="h-4 w-4" /> Sortido
          </Link>
        </div>
      </header>

      {saude.isLoading && (
        <p className="text-sm text-slate-500">A calcular saúde…</p>
      )}
      {saude.isError && (
        <p className="text-sm text-red-600">Não foi possível obter a saúde do catálogo.</p>
      )}

      {t && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase text-slate-400">Artigos</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{t.artigos}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase text-slate-400">Activos</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">{t.activos}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase text-slate-400">Fichas incompletas</p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">
              {t.fichasIncompletas}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase text-slate-400">Activos s/ sortido</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {t.activosSemSortido}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase text-slate-400">Completude média</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {t.completudeMediaPerc}%
            </p>
          </div>
        </section>
      )}

      {saude.data && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Tags className="h-5 w-5 text-emerald-600" />
              Dimensões em falta
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Contagem de artigos onde cada dimensão aplicável está vazia.
            </p>
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Dimensão</th>
                    <th className="px-4 py-3 font-medium">Peso</th>
                    <th className="px-4 py-3 font-medium">Em falta</th>
                  </tr>
                </thead>
                <tbody>
                  {saude.data.dimensoes.map((d) => (
                    <tr key={d.codigo} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-900">{d.nome}</td>
                      <td className="px-4 py-3">{d.peso}</td>
                      <td className="px-4 py-3">{d.contagem}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {saude.data.avisos.length > 0 && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="text-sm font-semibold text-amber-900">Avisos</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
                {saude.data.avisos.map((aviso) => (
                  <li key={aviso}>{aviso}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
