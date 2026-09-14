import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Sparkles, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useExcecoes, useDecidirExcecao, useAnalisarExcecaoMayra } from '@/features/stock';
import { Button } from '@/shared/ui';
import type { AcaoGestor, InventoryException } from '@/features/stock';

const CLASSIFICACAO_CONFIG: Record<
  NonNullable<InventoryException['classificacao']>,
  { label: string; className: string }
> = {
  CONFORME: { label: '🟢 Conforme', className: 'bg-emerald-100 text-emerald-700' },
  ATENCAO: { label: '🟠 Atenção', className: 'bg-amber-100 text-amber-700' },
  CRITICO: { label: '🔴 Crítico', className: 'bg-rose-100 text-rose-700' },
};

const ACOES: Array<{ acao: AcaoGestor; label: string; variant: 'success' | 'outline' | 'warning' | 'destructive' }> = [
  { acao: 'APROVAR_AJUSTE', label: 'Aprovar ajuste', variant: 'success' },
  { acao: 'SOLICITAR_RECONTAGEM', label: 'Solicitar recontagem', variant: 'outline' },
  { acao: 'INVESTIGAR', label: 'Investigar', variant: 'warning' },
  { acao: 'REJEITAR_AJUSTE', label: 'Rejeitar ajuste', variant: 'destructive' },
];

const moeda = (v: number) => v.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });

/**
 * Fila do Gestor (§12): Produto | Teórico | Físico | Diferença | Impacto |
 * Causa | Recomendação MAYRA | Ação. As 4 decisões nunca reaplicam sobre uma
 * exceção já decidida — o backend recusa, e aqui a linha só mostra os botões
 * de ação enquanto `acao` estiver por preencher.
 */
export function PainelExcecoesGestor({ cycleId }: { cycleId?: string }) {
  const [somenteAbertas, setSomenteAbertas] = useState(true);
  const { data: excecoes = [], isLoading } = useExcecoes({
    cycleId,
    decididas: somenteAbertas ? false : undefined,
  });
  const decidir = useDecidirExcecao();
  const analisarComMayra = useAnalisarExcecaoMayra();
  const [motivoPorExcecao, setMotivoPorExcecao] = useState<Record<string, string>>({});

  const handleAnalisar = (excecaoId: string) => {
    analisarComMayra.mutate(excecaoId, {
      onSuccess: () => toast.success('MAYRA classificou a divergência.'),
      onError: (err: any) =>
        toast.error(err?.response?.data?.message ?? 'Não foi possível obter a classificação da MAYRA.'),
    });
  };

  const handleDecidir = (excecao: InventoryException, acao: AcaoGestor) => {
    const motivo = motivoPorExcecao[excecao.id]?.trim();
    if (acao === 'REJEITAR_AJUSTE' && !motivo) {
      toast.error('Rejeitar um ajuste exige motivo.');
      return;
    }
    decidir.mutate(
      { excecaoId: excecao.id, payload: { acao, motivo: motivo || undefined } },
      {
        onSuccess: () => toast.success('Decisão registada.'),
        onError: (err: any) =>
          toast.error(err?.response?.data?.message ?? 'Não foi possível registar a decisão.'),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">Exceções para Decisão</h3>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          <input
            type="checkbox"
            checked={somenteAbertas}
            onChange={(e) => setSomenteAbertas(e.target.checked)}
          />
          Mostrar só as por decidir
        </label>
      </div>

      {excecoes.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-xl">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 text-sm font-medium">Nenhuma exceção pendente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {excecoes.map((e) => (
            <div key={e.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">{e.produto}</p>
                  <p className="text-xs text-slate-400">
                    {e.armazem}
                    {e.localizacao ? ` · ${e.localizacao}` : ''} · Ciclo: {e.cycleName}
                  </p>
                </div>
                {e.classificacao ? (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${CLASSIFICACAO_CONFIG[e.classificacao].className}`}
                  >
                    {CLASSIFICACAO_CONFIG[e.classificacao].label}
                  </span>
                ) : e.acao ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                    <Clock3 className="h-3 w-3" />
                    Não classificada
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={analisarComMayra.isPending}
                    onClick={() => handleAnalisar(e.id)}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {analisarComMayra.isPending ? 'A analisar...' : 'Analisar com MAYRA'}
                  </Button>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Metrica rotulo="Teórico" valor={String(e.teorico)} />
                <Metrica rotulo="Físico" valor={String(e.fisico)} />
                <Metrica
                  rotulo="Diferença"
                  valor={`${e.diferenca > 0 ? '+' : ''}${e.diferenca}`}
                  cor={e.diferenca < 0 ? 'text-rose-600' : e.diferenca > 0 ? 'text-emerald-600' : undefined}
                />
                <Metrica rotulo="Impacto" valor={e.impacto != null ? moeda(e.impacto) : '—'} />
              </div>

              {e.recomendacaoMayra && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50/60 px-3 py-2 text-xs text-blue-700">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Recomendação MAYRA{e.causa ? ` · ${formatarCausa(e.causa)}` : ''}</p>
                    <p className="mt-0.5">{e.recomendacaoMayra}</p>
                  </div>
                </div>
              )}

              {e.acao ? (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {e.acao === 'REJEITAR_AJUSTE' ? (
                    <XCircle className="h-3.5 w-3.5 text-rose-500" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                  <span>
                    Decidido: <span className="font-medium">{formatarAcao(e.acao)}</span>
                    {e.aprovador ? ` por ${e.aprovador}` : ''}
                    {e.motivo ? ` — ${e.motivo}` : ''}
                  </span>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {e.classificacao === 'CRITICO' && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Classificado como crítico — decisão humana obrigatória.
                    </p>
                  )}
                  <input
                    value={motivoPorExcecao[e.id] ?? ''}
                    onChange={(ev) =>
                      setMotivoPorExcecao((m) => ({ ...m, [e.id]: ev.target.value }))
                    }
                    placeholder="Motivo (obrigatório para rejeitar)"
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex flex-wrap gap-2">
                    {ACOES.map((a) => (
                      <Button
                        key={a.acao}
                        size="sm"
                        variant={a.variant}
                        disabled={decidir.isPending}
                        onClick={() => handleDecidir(e, a.acao)}
                      >
                        {a.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Metrica({ rotulo, valor, cor }: { rotulo: string; valor: string; cor?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[11px] text-slate-500">{rotulo}</p>
      <p className={`text-sm font-semibold tabular-nums ${cor ?? 'text-slate-800'}`}>{valor}</p>
    </div>
  );
}

function formatarCausa(causa: NonNullable<InventoryException['causa']>) {
  return { CAUSA_CONFIRMADA: 'Causa confirmada', CAUSA_PROVAVEL: 'Causa provável', EVIDENCIA_INSUFICIENTE: 'Evidência insuficiente' }[causa];
}

function formatarAcao(acao: AcaoGestor) {
  return {
    APROVAR_AJUSTE: 'Aprovar ajuste',
    SOLICITAR_RECONTAGEM: 'Solicitar recontagem',
    INVESTIGAR: 'Investigar',
    REJEITAR_AJUSTE: 'Rejeitar ajuste',
  }[acao];
}
