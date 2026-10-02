import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Sparkles, XCircle, RefreshCw, Truck, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { formatMoeda } from '@/shared/utils';
import { useExcecoes, useDecidirExcecao, useAnalisarExcecaoMayra, useExportarExcecoes } from '@/features/stock';
import { Button } from '@/shared/ui';
import type { AcaoGestor, InventoryException } from '@/features/stock';

// O texto de cada classificação e acção vem do catálogo; aqui ficam só o emoji, a cor e a variante.
const CLASSIFICACAO_CONFIG: Record<
  NonNullable<InventoryException['classificacao']>,
  { emoji: string; className: string }
> = {
  CONFORME: { emoji: '🟢', className: 'bg-emerald-100 text-emerald-700' },
  ATENCAO: { emoji: '🟠', className: 'bg-amber-100 text-amber-700' },
  CRITICO: { emoji: '🔴', className: 'bg-rose-100 text-rose-700' },
};

const ACOES: Array<{ acao: AcaoGestor; variant: 'success' | 'outline' | 'warning' | 'destructive' }> = [
  { acao: 'APROVAR_AJUSTE', variant: 'success' },
  { acao: 'SOLICITAR_RECONTAGEM', variant: 'outline' },
  { acao: 'INVESTIGAR', variant: 'warning' },
  { acao: 'REJEITAR_AJUSTE', variant: 'destructive' },
];

/**
 * Fila do Gestor (§12): Produto | Teórico | Físico | Diferença | Impacto |
 * Causa | Recomendação MAYRA | Ação. As 4 decisões nunca reaplicam sobre uma
 * exceção já decidida — o backend recusa, e aqui a linha só mostra os botões
 * de ação enquanto `acao` estiver por preencher.
 */
export function PainelExcecoesGestor({ cycleId }: { cycleId?: string }) {
  const { t } = useTranslation('stock');
  const [somenteAbertas, setSomenteAbertas] = useState(true);
  const { data: excecoes = [], isLoading } = useExcecoes({
    cycleId,
    decididas: somenteAbertas ? false : undefined,
  });
  const decidir = useDecidirExcecao();
  const analisarComMayra = useAnalisarExcecaoMayra();
  const exportar = useExportarExcecoes();
  const [motivoPorExcecao, setMotivoPorExcecao] = useState<Record<string, string>>({});

  const handleExportar = () => {
    exportar.mutate(
      { cycleId, decididas: somenteAbertas ? false : undefined },
      { onError: () => toast.error(t('excecao.erro_exportar')) },
    );
  };

  const handleAnalisar = (excecaoId: string) => {
    analisarComMayra.mutate(excecaoId, {
      onSuccess: () => toast.success(t('excecao.mayra_classificou')),
      onError: (err: any) =>
        toast.error(err?.response?.data?.message ?? t('excecao.erro_mayra')),
    });
  };

  const handleDecidir = (excecao: InventoryException, acao: AcaoGestor) => {
    const motivo = motivoPorExcecao[excecao.id]?.trim();
    if (acao === 'REJEITAR_AJUSTE' && !motivo) {
      toast.error(t('excecao.rejeitar_exige_motivo'));
      return;
    }
    decidir.mutate(
      { excecaoId: excecao.id, payload: { acao, motivo: motivo || undefined } },
      {
        onSuccess: (resultado) => {
          toast.success(t('excecao.decisao_registada'));
          if (resultado.recomendacao) {
            const r = resultado.recomendacao;
            toast(
              r.acao === 'TRANSFERIR'
                ? t('excecao.ruptura_transferir', { n: r.quantidade ?? '?', origem: r.armazemOrigemNome })
                : t('excecao.ruptura_comprar', { n: r.quantidade ?? '?' }),
              { icon: '🚚', duration: 6000 },
            );
          }
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.message ?? t('excecao.erro_decisao')),
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-700">{t('excecao.titulo')}</h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={somenteAbertas}
              onChange={(e) => setSomenteAbertas(e.target.checked)}
            />
            {t('excecao.so_por_decidir')}
          </label>
          <Button
            size="sm"
            variant="outline"
            disabled={exportar.isPending || excecoes.length === 0}
            onClick={handleExportar}
          >
            <Download className="h-3.5 w-3.5" />
            {exportar.isPending ? t('excecao.a_exportar') : t('excecao.exportar')}
          </Button>
        </div>
      </div>

      {excecoes.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-xl">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 text-sm font-medium">{t('excecao.nenhuma_pendente')}</p>
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
                    {e.localizacao ? ` · ${e.localizacao}` : ''} · {t('excecao.ciclo', { nome: e.cycleName })}
                  </p>
                </div>
                {e.classificacao ? (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${CLASSIFICACAO_CONFIG[e.classificacao].className}`}
                  >
                    {CLASSIFICACAO_CONFIG[e.classificacao].emoji} {t(`excecao.classificacao.${e.classificacao}`)}
                  </span>
                ) : e.acao ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                    <Clock3 className="h-3 w-3" />
                    {t('excecao.nao_classificada')}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={analisarComMayra.isPending}
                    onClick={() => handleAnalisar(e.id)}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {analisarComMayra.isPending ? t('excecao.a_analisar') : t('excecao.analisar_mayra')}
                  </Button>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Metrica rotulo={t('excecao.teorico')} valor={String(e.teorico)} />
                <Metrica rotulo={t('excecao.fisico')} valor={String(e.fisico)} />
                <Metrica
                  rotulo={t('excecao.diferenca')}
                  valor={`${e.diferenca > 0 ? '+' : ''}${e.diferenca}`}
                  cor={e.diferenca < 0 ? 'text-rose-600' : e.diferenca > 0 ? 'text-emerald-600' : undefined}
                />
                <Metrica rotulo={t('excecao.impacto')} valor={e.impacto != null ? formatMoeda(e.impacto) : '—'} />
              </div>

              {e.movimentosDuranteContagem > 0 && (
                <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50/60 px-3 py-2 text-xs text-amber-700">
                  <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                  {t('excecao.movimentos_durante', { n: e.movimentosDuranteContagem })}
                </p>
              )}

              {e.recomendacaoMayra && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50/60 px-3 py-2 text-xs text-blue-700">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('excecao.recomendacao_mayra')}{e.causa ? ` · ${t(`excecao.causa.${e.causa}`)}` : ''}</p>
                    <p className="mt-0.5">{e.recomendacaoMayra}</p>
                  </div>
                </div>
              )}

              {e.acao ? (
                <>
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {e.acao === 'REJEITAR_AJUSTE' ? (
                      <XCircle className="h-3.5 w-3.5 text-rose-500" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                    <span>
                      {t('excecao.decidido')} <span className="font-medium">{t(`excecao.acao.${e.acao}`)}</span>
                      {e.aprovador ? t('excecao.por', { nome: e.aprovador }) : ''}
                      {e.motivo ? ` — ${e.motivo}` : ''}
                    </span>
                  </div>

                  {e.recomendacao && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg bg-orange-50/60 px-3 py-2 text-xs text-orange-700">
                      <Truck className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <p>
                        {e.recomendacao.acao === 'TRANSFERIR' ? (
                          <>
                            {t('excecao.ruptura_transferir_antes', { n: e.recomendacao.quantidade ?? '?' })}{' '}
                            <span className="font-medium">{e.recomendacao.armazemOrigemNome}</span>.
                          </>
                        ) : (
                          <>{t('excecao.ruptura_comprar_linha', { n: e.recomendacao.quantidade ?? '?' })}</>
                        )}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-3 space-y-2">
                  {e.classificacao === 'CRITICO' && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {t('excecao.critico_obrigatoria')}
                    </p>
                  )}
                  <input
                    value={motivoPorExcecao[e.id] ?? ''}
                    onChange={(ev) =>
                      setMotivoPorExcecao((m) => ({ ...m, [e.id]: ev.target.value }))
                    }
                    placeholder={t('excecao.placeholder_motivo')}
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
                        {t(`excecao.acao.${a.acao}`)}
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

