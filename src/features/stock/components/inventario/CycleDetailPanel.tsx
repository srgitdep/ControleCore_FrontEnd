import { useState } from 'react';
import { ChevronRight, CheckCircle2, XCircle, BarChart3, ShieldCheck, Users, Users2 } from 'lucide-react';
import toast from 'react-hot-toast';
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
import type { InventoryCycleStatus } from '@/features/stock';

const STATUS_LABEL: Record<InventoryCycleStatus, string> = {
  RASCUNHO: 'Rascunho',
  PREPARADO: 'Preparado',
  EM_CONTAGEM: 'Em Contagem',
  PAUSADO: 'Pausado',
  VALIDACAO_DE_COBERTURA: 'A validar cobertura',
  EM_RECONCILIACAO: 'Em Reconciliação',
  AGUARDA_RECONTAGEM: 'Aguarda Recontagem',
  EM_ANALISE_MAYRA: 'Em Análise (MAYRA)',
  AGUARDA_APROVACAO: 'Aguarda Aprovação',
  AJUSTE_APROVADO: 'Ajuste Aprovado',
  ENCERRADO: 'Encerrado',
  CANCELADO: 'Cancelado',
  BLOQUEADO_POR_ERRO: 'Bloqueado por Erro',
};

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
  const { data: cycle, isLoading } = useInventoryCycleDetail(cycleId);
  const { data: cobertura } = useCobertura(cycleId, { poll: true });
  const { data: recontagens = [] } = useRecontagensPendentes(cycleId);
  const updateStatus = useUpdateCycleStatus();
  const cancelarCiclo = useCancelarCiclo();
  const reconciliar = useReconciliar();
  const [aba, setAba] = useState<'contagem' | 'recontagem' | 'excecoes'>('contagem');
  const [distribuirAberto, setDistribuirAberto] = useState(false);

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
      { onError: (err: any) => toast.error(err?.response?.data?.message ?? mensagemErro ?? 'Não foi possível avançar o ciclo.') },
    );

  const cancelar = () => {
    const motivo = window.prompt('Motivo do cancelamento:');
    if (!motivo?.trim()) return;
    cancelarCiclo.mutate(
      { cycleId, payload: { motivo: motivo.trim() } },
      { onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Não foi possível cancelar.') },
    );
  };

  const reconciliarAgora = () =>
    reconciliar.mutate(cycleId, {
      onSuccess: (res) => {
        toast.success(
          res.recontagensPendentes > 0
            ? `Reconciliado. ${res.recontagensPendentes} item(ns) precisam de recontagem.`
            : 'Reconciliado. Nenhuma divergência excedeu a tolerância.',
        );
        setAba(res.recontagensPendentes > 0 ? 'recontagem' : 'excecoes');
      },
      onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Não foi possível reconciliar.'),
    });

  const isTerminal = cycle.status === 'ENCERRADO' || cycle.status === 'CANCELADO';
  const pendentes = cobertura?.pendentes ?? 0;

  const TABS: TabDefinition<typeof aba>[] = [
    { id: 'contagem', label: 'Contagem', icon: BarChart3 },
    {
      id: 'recontagem',
      label: 'Recontagem',
      icon: ShieldCheck,
      badge: recontagens.length > 0 ? recontagens.length : undefined,
    },
    { id: 'excecoes', label: 'Exceções', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
          <ChevronRight className="h-5 w-5 rotate-180" />
        </button>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 text-lg">{cycle.name}</h3>
          <p className="text-slate-500 text-sm">{cycle.counts.length} item(ns) no perímetro</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_CLASSNAME[cycle.status]}`}>
          {STATUS_LABEL[cycle.status]}
        </span>
      </div>

      {!isTerminal && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600 max-w-lg">
            {cycle.status === 'PREPARADO' && 'Perímetro carregado. Inicie a contagem para os operadores poderem registar produtos.'}
            {cycle.status === 'EM_CONTAGEM' &&
              (pendentes > 0
                ? `Contagem a decorrer. Ainda existem ${pendentes} produto(s) por verificar.`
                : 'Todos os produtos foram verificados. Pode avançar para validar a cobertura.')}
            {cycle.status === 'PAUSADO' && 'Ciclo pausado. Retome para continuar a contagem.'}
            {cycle.status === 'VALIDACAO_DE_COBERTURA' && 'A validar cobertura — avance para reconciliar.'}
            {cycle.status === 'EM_RECONCILIACAO' && 'Execute a reconciliação para comparar físico com teórico.'}
            {cycle.status === 'AGUARDA_RECONTAGEM' && 'Existem itens pendentes de recontagem cega.'}
          </p>

          <div className="flex flex-wrap gap-2">
            {(cycle.status === 'PREPARADO' || cycle.status === 'EM_CONTAGEM') && (
              <Button variant="outline" onClick={() => setDistribuirAberto(true)}>
                <Users2 className="h-4 w-4" />
                Distribuir prateleiras
              </Button>
            )}
            {cycle.status === 'PREPARADO' && (
              <Button onClick={() => avancar('EM_CONTAGEM')} disabled={updateStatus.isPending}>
                Iniciar contagem
              </Button>
            )}
            {cycle.status === 'EM_CONTAGEM' && (
              <>
                <Button variant="outline" onClick={() => avancar('PAUSADO')} disabled={updateStatus.isPending}>
                  Pausar
                </Button>
                <Button
                  onClick={() => avancar('VALIDACAO_DE_COBERTURA', 'Conclua todos os produtos antes de finalizar o inventário.')}
                  disabled={pendentes > 0 || updateStatus.isPending}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Concluir Inventário
                </Button>
              </>
            )}
            {cycle.status === 'PAUSADO' && (
              <Button onClick={() => avancar('EM_CONTAGEM')} disabled={updateStatus.isPending}>
                Retomar contagem
              </Button>
            )}
            {cycle.status === 'VALIDACAO_DE_COBERTURA' && (
              <Button onClick={() => avancar('EM_RECONCILIACAO')} disabled={updateStatus.isPending}>
                Avançar para reconciliação
              </Button>
            )}
            {cycle.status === 'EM_RECONCILIACAO' && (
              <Button onClick={reconciliarAgora} disabled={reconciliar.isPending}>
                {reconciliar.isPending ? 'A reconciliar...' : 'Executar reconciliação'}
              </Button>
            )}
            <Button variant="destructive" onClick={cancelar} disabled={cancelarCiclo.isPending}>
              <XCircle className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {cycle.status === 'EM_CONTAGEM' || cycle.status === 'PAUSADO' || cycle.status === 'VALIDACAO_DE_COBERTURA' ? (
        <>
          <Tabs tabs={TABS} active={aba} onChange={setAba} label="Etapas do inventário" />
          {aba === 'contagem' && <PainelContagem cycleId={cycleId} />}
          {aba === 'recontagem' && <PainelRecontagem cycleId={cycleId} />}
          {aba === 'excecoes' && <PainelExcecoesGestor cycleId={cycleId} />}
        </>
      ) : cycle.status === 'AGUARDA_RECONTAGEM' || cycle.status === 'EM_ANALISE_MAYRA' || cycle.status === 'AGUARDA_APROVACAO' ? (
        <>
          <Tabs
            tabs={TABS.filter((t) => t.id !== 'contagem')}
            active={aba === 'contagem' ? 'recontagem' : aba}
            onChange={setAba}
            label="Etapas do inventário"
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
    </div>
  );
}
