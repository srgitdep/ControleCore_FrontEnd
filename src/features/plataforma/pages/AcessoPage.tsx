import { Building2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useContextoAcesso } from '../hooks/usePlataforma';

export function AcessoPage() {
  const { data, isLoading, isError } = useContextoAcesso();

  if (isLoading) {
    return <p className="text-sm text-slate-500">A calcular o acesso efectivo…</p>;
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
        Não foi possível simular o acesso actual.
      </div>
    );
  }

  const porModulo = data.permissoes.reduce<
    Record<string, typeof data.permissoes>
  >((grupos, permissao) => {
    (grupos[permissao.modulo] ??= []).push(permissao);
    return grupos;
  }, {});

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <ShieldCheck className="h-6 w-6 text-emerald-600" />
          O meu acesso
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Simulação efectiva das permissões e lojas aplicadas ao pedido actual.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Permissões efectivas</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{data.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Building2 className="h-4 w-4" /> Lojas permitidas
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {data.lojasPermitidas.length}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(porModulo).map(([modulo, permissoes]) => (
          <section
            key={modulo}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="mb-4 font-semibold capitalize text-slate-900">{modulo}</h2>
            <ul className="space-y-2">
              {permissoes?.map((permissao) => (
                <li
                  key={permissao.codigo}
                  className="flex items-start gap-2 text-sm text-slate-600"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>
                    {permissao.descricao}
                    <small className="block font-mono text-[11px] text-slate-400">
                      {permissao.codigo}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
