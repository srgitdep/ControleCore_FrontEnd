import { useSuperAdminDashboard } from '@/features/dashboard';
import { Building2, Users, Store, ShieldCheck } from 'lucide-react';
import { Card, CardCarousel, KpiCard } from '@/shared/ui';

export function SuperAdminDashboard() {
  const { data, isLoading } = useSuperAdminDashboard();

  if (isLoading) {
    return (
      <CardCarousel label="Indicadores" colunas={4}>
        {[0, 1, 2, 3].map((i) => (
          <KpiCard key={i} title="" value="" isLoading />
        ))}
      </CardCarousel>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
          Visão geral do sistema
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Estatísticas globais de todas as instâncias activas.
        </p>
      </div>

      <CardCarousel label="Indicadores do sistema" colunas={4}>
        <KpiCard
          title="Total de empresas"
          value={data.kpis.totalEmpresas.toLocaleString('pt-MZ')}
          icon={Building2}
          accent="primary"
          description="Contas activas"
        />
        <KpiCard
          title="Total de utilizadores"
          value={data.kpis.totalUtilizadores.toLocaleString('pt-MZ')}
          icon={Users}
          description="Membros registados"
        />
        <KpiCard
          title="Lojas registadas"
          value={data.kpis.totalLojas.toLocaleString('pt-MZ')}
          icon={Store}
          description="Pontos de venda"
        />
        <KpiCard
          title="Subscrições activas"
          value={data.kpis.subscricoesAtivas.toLocaleString('pt-MZ')}
          icon={ShieldCheck}
          accent="success"
          description="Planos regulares"
        />
      </CardCarousel>

      <Card padding="lg">
        <h3 className="text-[15px] font-semibold text-slate-900">
          Actividade recente do sistema
        </h3>
        <div className="mt-4 flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
          <p className="px-4 text-center text-sm text-slate-400">
            Os registos detalhados do sistema irão aparecer aqui
          </p>
        </div>
      </Card>
    </div>
  );
}
