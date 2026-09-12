import { AlertTriangle, ChevronRight, Sparkles, Users } from 'lucide-react';
import { useAtencao } from '../hooks/useClientes';
import type { ClienteAAgir, UrgenciaAccao } from '../api/clientes.api';
import { cn } from '@/shared/utils';

const moeda = (v: number) =>
  `${Number(v).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT`;

const URGENCIAS: Record<UrgenciaAccao, { rotulo: string; classe: string; barra: string }> = {
  URGENTE: {
    rotulo: 'Agir agora',
    classe: 'bg-amber-100 text-amber-800',
    barra: 'border-l-amber-500',
  },
  IMPORTANTE: {
    rotulo: 'A ter em conta',
    classe: 'bg-rose-100 text-rose-800',
    barra: 'border-l-rose-500',
  },
  OPORTUNIDADE: {
    rotulo: 'Oportunidade',
    classe: 'bg-blue-100 text-blue-800',
    barra: 'border-l-blue-500',
  },
  NENHUMA: { rotulo: '', classe: '', barra: 'border-l-slate-200' },
};

export function AnalisePanel({ onVerCliente }: { onVerCliente: (id: string) => void }) {
  const { data, isLoading, isError } = useAtencao();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
        <AlertTriangle size={36} strokeWidth={1} />
        <p className="text-sm">Não foi possível carregar a análise.</p>
      </div>
    );
  }

  const { clientes, saude } = data;

  return (
    <div className="custom-scrollbar h-full space-y-6 overflow-y-auto p-5">
      {/* Estado da base */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={15} className="text-violet-600" />
          <h3 className="text-sm font-semibold text-slate-700">Como está a sua base de clientes</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Numero rotulo="Clientes" valor={String(saude.clientes)} />
          <Numero
            rotulo="Já compraram"
            valor={String(saude.comCompras)}
            sub={
              saude.clientes > 0
                ? `${Math.round((saude.comCompras / saude.clientes) * 100)}% da base`
                : undefined
            }
          />
          <Numero
            rotulo="Contactáveis"
            valor={String(saude.contactaveis)}
            sub="aceitaram ser contactados"
            alerta={saude.contactaveis === 0}
          />
          <Numero
            rotulo="Valor a escapar"
            valor={moeda(saude.valorEmRisco)}
            sub="de quem precisa de atenção"
            alerta={saude.valorEmRisco > 0}
          />
        </div>
      </section>

      {/* O que está a limitar o CRM */}
      {saude.obstaculos.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">O que está a limitar</h3>
          <div className="space-y-2">
            {saude.obstaculos.map((o, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3"
              >
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
                <p className="text-sm text-amber-900">{o}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quem precisa de atenção */}
      <section>
        <div className="mb-3 flex items-baseline gap-2">
          <h3 className="text-sm font-semibold text-slate-700">Por onde começar</h3>
          {clientes.length > 0 && (
            <span className="text-xs text-slate-400">
              {clientes.length} cliente(s), do mais urgente ao menos
            </span>
          )}
        </div>

        {clientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 py-12 text-center">
            <Users size={32} strokeWidth={1} className="text-slate-300" />
            <div>
              <p className="text-sm font-medium text-slate-600">
                Nenhum cliente precisa de atenção agora.
              </p>
              <p className="mt-0.5 text-sm text-slate-400">
                {saude.comCompras === 0
                  ? 'Ainda não há compras identificadas para analisar.'
                  : 'Todos estão a comprar dentro do ritmo habitual.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {clientes.map((c: ClienteAAgir) => {
              const u = URGENCIAS[c.accao.urgencia];
              return (
                <button
                  key={c.clienteId}
                  onClick={() => onVerCliente(c.clienteId)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl border border-l-[3px] border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-300',
                    u.barra,
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-slate-900">{c.nome}</p>
                      {u.rotulo && (
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                            u.classe,
                          )}
                        >
                          {u.rotulo}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-600">{c.accao.porque}</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">
                      {c.accao.sugestao}
                    </p>

                    <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-400">
                      <span className="tabular-nums">{moeda(c.valorTotal)} de histórico</span>
                      {c.telefone && <span>{c.telefone}</span>}
                    </div>
                  </div>

                  <ChevronRight size={16} className="mt-1 shrink-0 text-slate-300" />
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Numero({
  rotulo,
  valor,
  sub,
  alerta,
}: {
  rotulo: string;
  valor: string;
  sub?: string;
  alerta?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{rotulo}</p>
      <p
        className={cn(
          'mt-1 text-xl font-bold tabular-nums',
          alerta ? 'text-amber-700' : 'text-slate-900',
        )}
      >
        {valor}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
