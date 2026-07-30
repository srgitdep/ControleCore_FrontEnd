import { Check, CreditCard, Gauge, PackageCheck } from 'lucide-react';
import {
  useConsumoPlano,
  useContextoAcesso,
  useEstadoSubscricao,
  usePlanos,
} from '../hooks/usePlataforma';

const ROTULOS_METRICA: Record<string, string> = {
  LOJAS: 'Lojas',
  CAIXAS: 'Caixas',
  ARMAZENS: 'Armazéns',
  UTILIZADORES: 'Utilizadores',
  ARTIGOS: 'Artigos',
  VENDAS_MES: 'Vendas / mês',
  ACCOES_IA_MES: 'Acções Mayra / mês',
  ESPACO_ANEXOS_MB: 'Anexos (MB)',
};

export function SubscricaoPage() {
  const estado = useEstadoSubscricao();
  const acesso = useContextoAcesso();
  const codigos = acesso.data?.permissoes.map((permissao) => permissao.codigo) ?? [];
  const podeGerir =
    codigos.includes('administracao.empresa.gerir') ||
    codigos.includes('administracao.perfil.ler');
  const consumo = useConsumoPlano(podeGerir);
  const planos = usePlanos(podeGerir);

  if (estado.isLoading) {
    return <p className="text-sm text-slate-500">A carregar subscrição…</p>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <CreditCard className="h-6 w-6 text-emerald-600" />
          Subscrição
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Plano actual, módulos contratados e utilização dos limites.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Plano actual</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {estado.data?.plano?.nome ?? 'Sem plano'}
          </p>
          <span className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {estado.data?.estado ?? 'INACTIVA'}
          </span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <PackageCheck className="h-4 w-4" /> Módulos activos
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {estado.data?.modulos.length ?? 0}
          </p>
          <p className="mt-2 text-xs capitalize text-slate-500">
            {estado.data?.modulos.join(' · ') || 'Nenhum módulo contratado'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Próxima renovação</p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {estado.data?.dataRenovacao
              ? new Intl.DateTimeFormat('pt-MZ').format(
                  new Date(estado.data.dataRenovacao),
                )
              : 'Não definida'}
          </p>
          <p className="mt-2 text-xs text-slate-500">{estado.data?.ciclo}</p>
        </div>
      </section>

      {!podeGerir && !acesso.isLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          O detalhe comercial e os limites estão disponíveis aos responsáveis pela
          administração da empresa.
        </div>
      )}

      {podeGerir && <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Gauge className="h-5 w-5 text-emerald-600" /> Consumo e limites
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {consumo.data?.map((item) => {
            const percentagem = Math.min(item.percentagem ?? 0, 100);
            const cor =
              percentagem >= 100
                ? 'bg-rose-500'
                : percentagem >= 90
                  ? 'bg-amber-500'
                  : 'bg-emerald-500';
            return (
              <article
                key={item.metrica}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-800">
                    {ROTULOS_METRICA[item.metrica] ?? item.metrica}
                  </h3>
                  <span className="text-sm font-semibold text-slate-700">
                    {item.actual} / {item.limite ?? '∞'}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${cor}`}
                    style={{ width: `${percentagem}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {item.percentagem === null
                    ? 'Sem limite'
                    : `${item.percentagem.toLocaleString('pt-MZ')}% utilizado`}
                </p>
              </article>
            );
          })}
        </div>
      </section>}

      {podeGerir && <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Planos disponíveis</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {planos.data?.map((plano) => {
            const actual = plano.codigo === estado.data?.plano?.codigo;
            return (
              <article
                key={plano.codigo}
                className={[
                  'rounded-xl border bg-white p-5',
                  actual
                    ? 'border-emerald-400 ring-2 ring-emerald-100'
                    : 'border-slate-200',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{plano.nome}</h3>
                  {actual && (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                      Actual
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">{plano.descricao}</p>
                <p className="mt-4 text-2xl font-bold text-slate-900">
                  {plano.precoBase.toLocaleString('pt-MZ')} MT
                </p>
                <ul className="mt-4 space-y-2">
                  {plano.modulos.map((modulo) => (
                    <li key={modulo} className="flex gap-2 text-sm capitalize text-slate-600">
                      <Check className="h-4 w-4 text-emerald-500" /> {modulo}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>}
    </div>
  );
}
