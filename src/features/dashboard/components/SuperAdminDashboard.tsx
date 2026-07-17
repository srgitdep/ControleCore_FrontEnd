import { useQuery } from '@tanstack/react-query';
import { Building2, Users, Store, ShieldCheck } from 'lucide-react';
import { KpiCard } from './KpiCard';
import { getSuperAdminDashboard } from '@/features/dashboard';

export function SuperAdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'superadmin'],
    queryFn: getSuperAdminDashboard,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">VisÃ£o Geral do Sistema</h2>
        <p className="text-sm text-slate-500 mt-1">EstatÃ­sticas globais para todas as instÃ¢ncias ativas.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total de Empresas"
          value={data.kpis.totalEmpresas.toLocaleString()}
          icon={Building2}
          trendLabel="Contas ativas"
        />
        <KpiCard
          title="Total de Utilizadores"
          value={data.kpis.totalUtilizadores.toLocaleString()}
          icon={Users}
          trendLabel="Membros registados"
        />
        <KpiCard
          title="Lojas Registadas"
          value={data.kpis.totalLojas.toLocaleString()}
          icon={Store}
          trendLabel="Pontos de venda"
        />
        <KpiCard
          title="SubscriÃ§Ãµes Ativas"
          value={data.kpis.subscricoesAtivas.toLocaleString()}
          icon={ShieldCheck}
          trendLabel="Planos regulares"
        />
      </div>

      <div className="mt-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-[15px] font-medium text-slate-900">Atividade Recente do Sistema</h3>
          </div>
          <div className="flex items-center justify-center h-40 bg-slate-50 rounded-xl border border-dashed border-slate-200">
             <p className="text-sm text-slate-400">Os logs detalhados do sistema irÃ£o aparecer aqui</p>
          </div>
        </div>
      </div>
    </div>
  );
}
