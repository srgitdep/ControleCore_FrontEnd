import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Plus, ChevronRight, Lock, Sliders } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useInventoryCycles } from '@/features/stock';
import { Button } from '@/shared/ui';
import { CreateCycleModal } from './CreateCycleModal';
import { CycleDetailPanel } from './inventario/CycleDetailPanel';
import { PainelContagem } from './inventario/PainelContagem';
import { GerirToleranciasModal } from './inventario/GerirToleranciasModal';
import { DashboardInventario } from './inventario/DashboardInventario';
import type { InventoryCycle, InventoryCycleStatus } from '@/features/stock';

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

const ESTADOS_ATIVOS: InventoryCycleStatus[] = [
  'PREPARADO', 'EM_CONTAGEM', 'PAUSADO', 'VALIDACAO_DE_COBERTURA',
  'EM_RECONCILIACAO', 'AGUARDA_RECONTAGEM', 'EM_ANALISE_MAYRA', 'AGUARDA_APROVACAO',
];

function ManagerCycleList({
  cycles,
  isLoading,
  onSelectCycle,
  onCreateCycle,
  onGerirTolerancias,
}: {
  cycles: InventoryCycle[];
  isLoading: boolean;
  onSelectCycle: (id: string) => void;
  onCreateCycle: () => void;
  onGerirTolerancias: () => void;
}) {
  const { t } = useTranslation('stock');
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardInventario onSelectCycle={onSelectCycle} />

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">{t('inventario.ciclos_titulo')}</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onGerirTolerancias} className="gap-2">
            <Sliders className="h-4 w-4" />
            {t('inventario.tolerancias')}
          </Button>
          <Button onClick={onCreateCycle} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('inventario.novo_ciclo')}
          </Button>
        </div>
      </div>

      {cycles.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-xl">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 text-sm font-medium">{t('inventario.nenhum_ciclo')}</p>
          <p className="text-slate-400 text-xs mt-1">
            {t('inventario.nenhum_ciclo_dica')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {cycles.map((cycle) => (
            <button
              key={cycle.id}
              onClick={() => onSelectCycle(cycle.id)}
              className="w-full flex items-center gap-4 px-4 py-4 bg-white border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all text-left group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{cycle.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSNAME[cycle.status]}`}>
                    {t(`ciclo_estado.${cycle.status}`)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {t('inventario.n_itens', { n: cycle._count?.counts ?? 0 })}
                  </span>
                  {cycle.createdBy && (
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      {t('inventario.por', { nome: cycle.createdBy.name })}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400 transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function InventoryTab() {
  const { t } = useTranslation('stock');
  const { user } = useAuth();
  const { data: cycles = [], isLoading } = useInventoryCycles();
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTolerancias, setShowTolerancias] = useState(false);

  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN';

  const activeCycle = cycles.find((c) => ESTADOS_ATIVOS.includes(c.status));

  // ── Visão Operador: só contagem cega, sem acesso à fila do Gestor ──
  if (!isManager) {
    if (!activeCycle || (activeCycle.status !== 'EM_CONTAGEM' && activeCycle.status !== 'PAUSADO')) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 bg-slate-100 rounded-full mb-4">
            <Lock className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {activeCycle ? t('inventario.contagem_nao_iniciada') : t('inventario.nenhum_ciclo_activo')}
          </h3>
          <p className="text-slate-500 text-sm max-w-sm">
            {activeCycle
              ? t('inventario.ciclo_em_estado', {
                  nome: activeCycle.name,
                  estado: t(`ciclo_estado.${activeCycle.status}`),
                })
              : t('inventario.sem_ciclo_em_andamento')}
          </p>
        </div>
      );
    }
    return <PainelContagem cycleId={activeCycle.id} />;
  }

  // ── Visão Gestor ──
  return (
    <div>
      {selectedCycleId ? (
        <CycleDetailPanel cycleId={selectedCycleId} onBack={() => setSelectedCycleId(null)} />
      ) : (
        <ManagerCycleList
          cycles={cycles}
          isLoading={isLoading}
          onSelectCycle={setSelectedCycleId}
          onCreateCycle={() => setShowCreateModal(true)}
          onGerirTolerancias={() => setShowTolerancias(true)}
        />
      )}

      {showCreateModal && (
        <CreateCycleModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(cycleId) => {
            setShowCreateModal(false);
            setSelectedCycleId(cycleId);
          }}
        />
      )}

      {showTolerancias && <GerirToleranciasModal onClose={() => setShowTolerancias(false)} />}
    </div>
  );
}
