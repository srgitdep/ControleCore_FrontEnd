import { useState } from 'react';
import { ChevronRight, CheckCircle2, XCircle, BarChart3, ShieldCheck, Users, Users2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  useInventoryCycleDetail,
  useCobertura,
  useUpdateCycleStatus,
  useCancelarCiclo,
  useReconciliar,
  useRecontagensPendentes,
} from '@/features/stock';
import { Button, Tabs, type TabDefinition } from '@/shared/ui';
import { PainelContagem } from './PainelContagem';
import { PainelRecontagem } from './PainelRecontagem';
import { PainelExcecoesGestor } from './PainelExcecoesGestor';
import { AtribuirPrateleirasModal } from './AtribuirPrateleirasModal';
import { FecharCicloModal } from './FecharCicloModal';
import type { InventoryCycleStatus } from '@/features/stock';

const STATUS_CLASSNAME: Record<InventoryCycleStatus, string> = {
  RASCUNHO: 'bg-slate-100 text-slate-500',
  PREPARADO: 'bg-blue-100 text-blue-700',
  EM_CONTAGEM: 'bg-amber-100 text-amber-700',
  PAUSADO: 'bg-slate-100 text-slate-600',
  VALIDACAO_DE_COBERTURA: 'bg-amber-100 text-amber-700',
  EM_RECONCILIACAO: 'bg-purple-100 text-purple-700',
  AGUARDA_RECONTAGEM: 'bg-purple-100 text-purple-700',
  EM_ANALISE_MAYRA: 'bg-blue-100 text-blue-700',
  AGUARDA_APROVACAO: 'bg-amber-100 text-amber-700',
  AJUSTE_APROVADO: 'bg-emerald-100 text-emerald-700',
  ENCERRADO: 'bg-slate-100 text-slate-500',
  CANCELADO: 'bg-rose-100 text-rose-700',
  BLOQUEADO_POR_ERRO: 'bg-rose-100 text-rose-700',
};

export function CycleDetailPanel({ cycleId, onBack }: { cycleId: string; onBack: () => void }) {
  const { t } = useTranslation('stock');
  const { data: cycle, isLoading } = useInventoryCycleDetail(cycleId);
  const { data: cobertura } = useCobertura(cycleId, { poll: true });
  const { data: recontagens = [] } = useRecontagensPendentes(cycleId);
  const updateStatus = useUpdateCycleStatus();
  const cancelarCiclo = useCancelarCiclo();
  const reconciliar = useReconciliar();
  const [aba, setAba] = useState<'contagem' | 'recontagem' | 'excecoes'>('contagem');
  const [distribuirAberto, setDistribuirAberto] = useState(false);
  const [fecharDirectoAberto, setFecharDirectoAberto] = useState(false);

  if (isLoading || !cycle) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const avancar = (status: InventoryCycleStatus, mensagemErro?: string) =>
    updateStatus.mutate(
      { cycleId, payload: { status } },
      { onError: (err: any) => toast.error(err?.response?.data?.message ?? mensagemErro ?? t('ciclo.erro_avancar')) },
    );

  const cancelar = () => {
    const motivo = window.prompt(t('ciclo.prompt_motivo'));
    if (!motivo?.trim()) return;
    cancelarCiclo.mutate(
      { cycleId, payload: { motivo: motivo.trim() } },
      { onError: (err: any) => toast.error(err?.response?.data?.message ?? t('ciclo.erro_cancelar')) },
    );
  };

  const reconciliarAgora = () =>
    reconciliar.mutate(cycleId, {
      onSuccess: (res) => {
        toast.success(
          res.recontagensPendentes > 0
            ? t('ciclo.reconciliado_recontagem', { n: res.recontagensPendentes })
            : t('ciclo.reconciliado_ok'),
        );
        setAba(res.recontagensPendentes > 0 ? 'recontagem' : 'excecoes');
      },
      onError: (err: any) => toast.error(err?.response?.data?.message ?? t('ciclo.erro_reconciliar')),
    });

  const isTerminal = cycle.status === 'ENCERRADO' || cycle.status === 'CANCELADO';
  const pendentes = cobertura?.pendentes ?? 0;

  const TABS: TabDefinition<typeof aba>[] = [
    { id: 'contagem', label: t('ciclo.tab_contagem'), icon: BarChart3 },
    {
      id: 'recontagem',
      label: t('ciclo.tab_recontagem'),
      icon: ShieldCheck,
      badge: recontagens.length > 0 ? recontagens.length : undefined,
    },
    { id: 'excecoes', label: t('ciclo.tab_excecoes'), icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
          <ChevronRight className="h-5 w-5 rotate-180" />
        </button>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 text-lg">{cycle.name}</h3>
          <p className="text-slate-500 text-sm">{t('ciclo.n_itens_perimetro', { n: cycle.counts.length })}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_CLASSNAME[cycle.status]}`}>
          {t(`ciclo_estado.${cycle.status}`)}
        </span>
      </div>

      {!isTerminal && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600 max-w-lg">
            {cycle.status === 'PREPARADO' && t('ciclo.ajuda_preparado')}
            {cycle.status === 'EM_CONTAGEM' &&
              (pendentes > 0
                ? t('ciclo.ajuda_em_contagem_pendentes', { n: pendentes })
                : t('ciclo.ajuda_em_contagem_completa'))}
            {cycle.status === 'PAUSADO' && t('ciclo.ajuda_pausado')}
            {cycle.status === 'VALIDACAO_DE_COBERTURA' && t('ciclo.ajuda_validacao')}
            {cycle.status === 'EM_RECONCILIACAO' && t('ciclo.ajuda_reconciliacao')}
            {cycle.status === 'AGUARDA_RECONTAGEM' && t('ciclo.ajuda_recontagem')}
            {cycle.status === 'AJUSTE_APROVADO' &&
              t('ciclo.ajuda_ajuste_aprovado')}
          </p>

          <div className="flex flex-wrap gap-2">
            {(cycle.status === 'PREPARADO' || cycle.status === 'EM_CONTAGEM') && (
              <Button variant="outline" onClick={() => setDistribuirAberto(true)}>
                <Users2 className="h-4 w-4" />
                {t('ciclo.distribuir_prateleiras')}
              </Button>
            )}
            {cycle.status === 'PREPARADO' && (
              <Button onClick={() => avancar('EM_CONTAGEM')} disabled={updateStatus.isPending}>
                {t('ciclo.iniciar_contagem')}
              </Button>
            )}
            {cycle.status === 'EM_CONTAGEM' && (
              <>
                <Button variant="outline" onClick={() => avancar('PAUSADO')} disabled={updateStatus.isPending}>
                  {t('ciclo.pausar')}
                </Button>
                <Button
                  onClick={() => avancar('VALIDACAO_DE_COBERTURA', t('ciclo.erro_concluir_antes'))}
                  disabled={pendentes > 0 || updateStatus.isPending}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {t('ciclo.concluir_inventario')}
                </Button>
              </>
            )}
            {cycle.status === 'PAUSADO' && (
              <Button onClick={() => avancar('EM_CONTAGEM')} disabled={updateStatus.isPending}>
                {t('ciclo.retomar_contagem')}
              </Button>
            )}
            {cycle.status === 'VALIDACAO_DE_COBERTURA' && (
              <Button onClick={() => avancar('EM_RECONCILIACAO')} disabled={updateStatus.isPending}>
                {t('ciclo.avancar_reconciliacao')}
              </Button>
            )}
            {cycle.status === 'EM_RECONCILIACAO' && (
              <>
                <Button variant="outline" onClick={() => setFecharDirectoAberto(true)}>
                  {t('ciclo.fechar_directamente')}
                </Button>
                <Button onClick={reconciliarAgora} disabled={reconciliar.isPending}>
                  {reconciliar.isPending ? t('ciclo.a_reconciliar') : t('ciclo.executar_reconciliacao')}
                </Button>
              </>
            )}
            {cycle.status === 'AJUSTE_APROVADO' && (
              <Button onClick={() => avancar('ENCERRADO')} disabled={updateStatus.isPending}>
                <CheckCircle2 className="h-4 w-4" />
                {updateStatus.isPending ? t('ciclo.a_encerrar') : t('ciclo.encerrar')}
              </Button>
            )}
            <Button variant="destructive" onClick={cancelar} disabled={cancelarCiclo.isPending}>
              <XCircle className="h-4 w-4" />
              {t('geral.cancelar')}
            </Button>
          </div>
        </div>
      )}

      {cycle.status === 'EM_CONTAGEM' || cycle.status === 'PAUSADO' || cycle.status === 'VALIDACAO_DE_COBERTURA' ? (
        <>
          <Tabs tabs={TABS} active={aba} onChange={setAba} label={t('ciclo.etapas')} />
          {aba === 'contagem' && <PainelContagem cycleId={cycleId} />}
          {aba === 'recontagem' && <PainelRecontagem cycleId={cycleId} />}
          {aba === 'excecoes' && <PainelExcecoesGestor cycleId={cycleId} />}
        </>
      ) : cycle.status === 'AGUARDA_RECONTAGEM' || cycle.status === 'EM_ANALISE_MAYRA' || cycle.status === 'AGUARDA_APROVACAO' ? (
        <>
          <Tabs
            tabs={TABS.filter((tab) => tab.id !== 'contagem')}
            active={aba === 'contagem' ? 'recontagem' : aba}
            onChange={setAba}
            label={t('ciclo.etapas')}
          />
          {aba === 'recontagem' && <PainelRecontagem cycleId={cycleId} />}
          {aba === 'excecoes' && <PainelExcecoesGestor cycleId={cycleId} />}
        </>
      ) : (
        <PainelExcecoesGestor cycleId={cycleId} />
      )}

      {distribuirAberto && (
        <AtribuirPrateleirasModal
          cycleId={cycleId}
          counts={cycle.counts}
          onClose={() => setDistribuirAberto(false)}
        />
      )}

      {fecharDirectoAberto && (
        <FecharCicloModal
          cycleId={cycleId}
          onClose={() => setFecharDirectoAberto(false)}
          onClosed={() => setFecharDirectoAberto(false)}
        />
      )}
    </div>
  );
}
