import { useAdminDashboard } from '@/features/dashboard';
import { DollarSign, FileText, Package, Users } from 'lucide-react';
import { KpiCard } from './KpiCard';
import { SalesChart } from './SalesChart';

export function AdminDashboard() {
  const { data, isLoading } = useAdminDashboard();

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Faturação (Mês Atual)"
          value={`${(data.kpis.vendasTotalMeticais || 0).toLocaleString()} MT`}
          icon={DollarSign}
          trend={12.5}
          trendLabel="Comparado ao mês passado"
        />
        <KpiCard
          title="Nº de Vendas (Mês Atual)"
          value={data.kpis.vendasTotalFaturas.toLocaleString()}
          icon={FileText}
          trend={-5.2}
          trendLabel="Requer atenção"
        />
        <KpiCard
          title="Produtos (Baixo Stock)"
          value={data.kpis.produtosBaixoStock.toLocaleString()}
          icon={Package}
          trend={0}
          trendLabel="Acima do mínimo estabelecido"
        />
        <KpiCard
          title="Funcionários Presentes Hoje"
          value={data.kpis.funcionariosPresentes.toLocaleString()}
          icon={Users}
          trend={4.5}
          trendLabel="Em relação ao normal"
        />
      </div>

      <div className="mt-8">
        <SalesChart 
          data={data.graficoVendasSemana} 
          title="Atividade de Vendas"
          subtitle="Atividade de vendas nos últimos 7 dias"
        />
      </div>
    </div>
  );
}
