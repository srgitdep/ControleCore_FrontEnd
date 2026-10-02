import { useAdminDashboard } from '@/features/dashboard';
import { DollarSign, FileText, Package, PackageCheck, Users } from 'lucide-react';
import { CardCarousel, KpiCard } from '@/shared/ui';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatMoeda, formatInteiro } from '@/shared/utils';
import { SalesChart } from './SalesChart';

/**
 * O painel de gestão.
 *
 * ## Os indicadores deslizam em vez de empilhar
 *
 * A grelha era `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`: num telemóvel, os cartões
 * empilhavam-se um debaixo do outro, mais de 500px de altura antes de o gráfico
 * começar. O `CardCarousel` põe-nos na horizontal em `<lg` e mantém a grelha acima
 * disso — o que também é o que permite acrescentar um indicador sem empurrar o
 * gráfico para fora do ecrã no telemóvel.
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
  const { t } = useTranslation('painel');
  const navigate = useNavigate();
  const { data, isLoading } = useAdminDashboard();

  // O esqueleto usa os mesmos cartões, para o conteúdo não saltar de posição quando os
  // dados chegam.
  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardCarousel label={t('gestao.indicadores')} colunas={5}>
          {[0, 1, 2, 3, 4].map((i) => (
            <KpiCard key={i} title="" value="" isLoading />
          ))}
        </CardCarousel>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <CardCarousel label={t('gestao.indicadores_mes')} colunas={5}>
        <KpiCard
          title={t('gestao.faturacao')}
          value={formatMoeda(data.kpis.vendasTotalMeticais || 0)}
          icon={DollarSign}
          accent="primary"
        />
        <KpiCard
          title={t('gestao.numero_vendas')}
          value={formatInteiro(data.kpis.vendasTotalFaturas)}
          icon={FileText}
        />
        <KpiCard
          title={t('gestao.stock_baixo')}
          value={formatInteiro(data.kpis.produtosBaixoStock)}
          icon={Package}
          // Um número que assinala um problema tem de levar ao problema. Anunciar
          // «4 produtos abaixo do mínimo» e deixar quem lê a procurar quais são numa
          // tabela paginada é dar o alarme e esconder a lista.
          //
          // O destino é a aba do stock com o filtro ligado, e o filtro vive no URL:
          // recarregar mantém-no, e o endereço pode ser enviado a quem trata da
          // reposição.
          //
          // Sem nada abaixo do mínimo não há lista para abrir, e um cartão que se
          // carrega para não mostrar nada é pior do que um cartão parado.
          onClick={
            data.kpis.produtosBaixoStock > 0
              ? () => navigate('/stock?tab=estoque&stockBaixo=true')
              : undefined
          }
          // A barra fica âmbar só quando há algo a tratar: um alerta permanente deixa
          // de ser um alerta.
          accent={data.kpis.produtosBaixoStock > 0 ? 'warning' : 'success'}
          description={
            data.kpis.produtosBaixoStock > 0
              ? t('gestao.abaixo_minimo')
              : t('gestao.todos_acima_minimo')
          }
        />
        <KpiCard
          title={t('gestao.funcionarios_presentes')}
          value={formatInteiro(data.kpis.funcionariosPresentes)}
          icon={Users}
        />
        <KpiCard
          title={t('gestao.pedidos_pendentes')}
          value={formatInteiro(data.kpis.pedidosPendentes ?? 0)}
          icon={PackageCheck}
          // Um pedido online só entra na facturação e no caixa quando o levantamento
          // é confirmado. Enquanto ninguém o fecha, não aparece em mais nenhum
          // indicador deste painel — daí o cartão levar directamente à fila onde se
          // avança o pedido, pelo mesmo princípio do cartão de stock baixo.
          onClick={
            (data.kpis.pedidosPendentes ?? 0) > 0
              ? () => navigate('/commerce/pedidos')
              : undefined
          }
          accent={(data.kpis.pedidosPendentes ?? 0) > 0 ? 'warning' : 'success'}
          description={
            (data.kpis.pedidosPendentes ?? 0) > 0
              ? t('gestao.pedidos_em_espera')
              : t('gestao.sem_pedidos')
          }
        />
      </CardCarousel>

      <SalesChart
        data={data.graficoVendasSemana}
        title={t('gestao.grafico_titulo')}
        subtitle={t('gestao.grafico_subtitulo')}
      />
    </div>
  );
}
