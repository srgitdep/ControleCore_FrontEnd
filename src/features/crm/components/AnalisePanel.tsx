import { AlertTriangle, ChevronRight, Sparkles, Users } from 'lucide-react';
import { useAtencao } from '../hooks/useClientes';
import type { ClienteAAgir, UrgenciaAccao } from '../api/clientes.api';
import { useTranslation } from 'react-i18next';
import { cn, formatMoeda } from '@/shared/utils';

const moeda = (v: number) => formatMoeda(Number(v));

const URGENCIAS: Record<
  UrgenciaAccao,
  {
    rotulo: 'analise.urgencia_urgente' | 'analise.urgencia_importante' | 'analise.urgencia_oportunidade' | null;
    classe: string;
    barra: string;
  }
> = {
  URGENTE: {
    rotulo: 'analise.urgencia_urgente',
    classe: 'bg-amber-100 text-amber-800',
    barra: 'border-l-amber-500',
  },
  IMPORTANTE: {
    rotulo: 'analise.urgencia_importante',
    classe: 'bg-rose-100 text-rose-800',
    barra: 'border-l-rose-500',
  },
  OPORTUNIDADE: {
    rotulo: 'analise.urgencia_oportunidade',
    classe: 'bg-blue-100 text-blue-800',
    barra: 'border-l-blue-500',
  },
  NENHUMA: { rotulo: null, classe: '', barra: 'border-l-slate-200' },
};

export function AnalisePanel({ onVerCliente }: { onVerCliente: (id: string) => void }) {
  const { t } = useTranslation('crm');
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
        <p className="text-sm">{t('analise.erro_carregar')}</p>
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
          <h3 className="text-sm font-semibold text-slate-700">{t('analise.titulo_base')}</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Numero rotulo={t('analise.clientes')} valor={String(saude.clientes)} />
          <Numero
            rotulo={t('analise.ja_compraram')}
            valor={String(saude.comCompras)}
            sub={
              saude.clientes > 0
                ? t('analise.percentagem_base', { n: Math.round((saude.comCompras / saude.clientes) * 100) })
                : undefined
            }
          />
          <Numero
            rotulo={t('analise.contactaveis')}
            valor={String(saude.contactaveis)}
            sub={t('analise.contactaveis_sub')}
            alerta={saude.contactaveis === 0}
          />
          <Numero
            rotulo={t('analise.valor_a_escapar')}
            valor={moeda(saude.valorEmRisco)}
            sub={t('analise.valor_a_escapar_sub')}
            alerta={saude.valorEmRisco > 0}
          />
        </div>
      </section>

      {/* O que está a limitar o CRM */}
      {saude.obstaculos.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">{t('analise.o_que_limita')}</h3>
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
          <h3 className="text-sm font-semibold text-slate-700">{t('analise.por_onde_comecar')}</h3>
          {clientes.length > 0 && (
            <span className="text-xs text-slate-400">
              {t('analise.contagem_ordem', { n: clientes.length })}
            </span>
          )}
        </div>

        {clientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 py-12 text-center">
            <Users size={32} strokeWidth={1} className="text-slate-300" />
            <div>
              <p className="text-sm font-medium text-slate-600">
                {t('analise.nenhum_precisa')}
              </p>
              <p className="mt-0.5 text-sm text-slate-400">
                {saude.comCompras === 0
                  ? t('analise.sem_compras')
                  : t('analise.ritmo_habitual')}
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
                          {t(u.rotulo)}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-600">{c.accao.porque}</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">
                      {c.accao.sugestao}
                    </p>

                    <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-400">
                      <span className="tabular-nums">{t('analise.de_historico', { valor: moeda(c.valorTotal) })}</span>
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
