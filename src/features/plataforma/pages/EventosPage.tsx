import { Activity, Radio } from 'lucide-react';
import { useMapaEventos, useRegistoEventos } from '../hooks/usePlataforma';

export function EventosPage() {
  const mapa = useMapaEventos();
  const registo = useRegistoEventos();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Radio className="h-6 w-6 text-emerald-600" />
          Eventos da plataforma
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Mapa dos eventos activos no código e registo recente de publicações.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-slate-900">Eventos activos</h2>
        {mapa.isLoading ? (
          <p className="text-sm text-slate-500">A carregar…</p>
        ) : (
          <ul className="space-y-2">
            {mapa.data?.activos.map((nome) => (
              <li
                key={nome}
                className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm text-slate-700"
              >
                {nome}
              </li>
            ))}
          </ul>
        )}
        {mapa.data && Object.keys(mapa.data.aliases).length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium text-slate-600">Aliases legados</h3>
            <ul className="space-y-1 text-sm text-slate-500">
              {Object.entries(mapa.data.aliases).map(([de, para]) => (
                <li key={de} className="font-mono">
                  {de} → {para}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
          <Activity className="h-4 w-4" /> Registo recente
        </h2>
        {registo.isLoading ? (
          <p className="text-sm text-slate-500">A carregar…</p>
        ) : registo.data?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Momento</th>
                  <th className="py-2 pr-4">Direcção</th>
                  <th className="py-2">Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registo.data.map((entrada, index) => (
                  <tr key={`${entrada.momento}-${entrada.nome}-${index}`}>
                    <td className="py-2 pr-4 text-slate-500">
                      {new Intl.DateTimeFormat('pt-MZ', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      }).format(new Date(entrada.momento))}
                    </td>
                    <td className="py-2 pr-4 capitalize text-slate-700">
                      {entrada.direccao}
                    </td>
                    <td className="py-2 font-mono text-slate-800">{entrada.nome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Ainda não há eventos registados nesta instância.</p>
        )}
      </section>
    </div>
  );
}
