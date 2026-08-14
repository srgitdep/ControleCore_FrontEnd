import { useAdminDashboard } from '@/features/dashboard';
import { DollarSign, FileText, Package, Users } from 'lucide-react';
import { CardCarousel, KpiCard } from '@/shared/ui';
import { SalesChart } from './SalesChart';

/**
 * O painel de gestão.
 *
 * ## Os indicadores deslizam em vez de empilhar
 *
 * A grelha era `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`: num telemóvel, quatro
 * cartões um debaixo do outro, cerca de 520px de altura antes de o gráfico começar. O
 * `CardCarousel` põe-nos na horizontal em `<lg` e mantém a grelha acima disso.
 *
 * ## As variações inventadas saíram
 *
 * Os cartões mostravam `trend={12.5}`, `trend={-5.2}` e `trend={4.5}` — valores
 * **escritos no código**, não calculados. `DashboardKpis` só tem quatro números
 * absolutos; não há dados do mês anterior em lado nenhum. Um painel que anuncia «+12,5%
 * comparado ao mês passado» sobre um número inventado é pior do que não mostrar
 * variação: leva a decisões.
 *
 * As descrições ficam, porque essas são verdadeiras — dizem o que o número é, não como
 * evoluiu.
 */
export function AdminDashboard() {
  const { data, isLoading } = useAdminDashboard();

  // O esqueleto usa os mesmos cartões, para o conteúdo não saltar de posição quando os
  // dados chegam.
  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardCarousel label="Indicadores" colunas={4}>
          {[0, 1, 2, 3].map((i) => (
            <KpiCard key={i} title="" value="" isLoading />
          ))}
        </CardCarousel>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <CardCarousel label="Indicadores do mês" colunas={4}>
        <KpiCard
          title="Faturação (mês atual)"
          value={`${(data.kpis.vendasTotalMeticais || 0).toLocaleString('pt-MZ')} MT`}
          icon={DollarSign}
          accent="primary"
        />
        <KpiCard
          title="Nº de vendas (mês atual)"
          value={data.kpis.vendasTotalFaturas.toLocaleString('pt-MZ')}
          icon={FileText}
        />
        <KpiCard
          title="Produtos com stock baixo"
          value={data.kpis.produtosBaixoStock.toLocaleString('pt-MZ')}
          icon={Package}
          // A barra fica âmbar só quando há algo a tratar: um alerta permanente deixa
          // de ser um alerta.
          accent={data.kpis.produtosBaixoStock > 0 ? 'warning' : 'success'}
          description={
            data.kpis.produtosBaixoStock > 0
              ? 'Abaixo do mínimo definido'
              : 'Todos acima do mínimo'
          }
        />
        <KpiCard
          title="Funcionários presentes hoje"
          value={data.kpis.funcionariosPresentes.toLocaleString('pt-MZ')}
          icon={Users}
        />
      </CardCarousel>

      <SalesChart
        data={data.graficoVendasSemana}
        title="Atividade de vendas"
        subtitle="Últimos 7 dias"
      />
    </div>
  );
}
