import { useSuperAdminDashboard } from '@/features/dashboard';
import { Building2, Users, Store, ShieldCheck, Hourglass, AlertTriangle, Ban, TrendingUp } from 'lucide-react';
import { Card, CardCarousel, KpiCard } from '@/shared/ui';
import { useTranslation } from 'react-i18next';
import { formatInteiro, formatMoeda } from '@/shared/utils';
import { SuperAdminsCard } from './SuperAdminsCard';
import { ActividadeRecente } from './ActividadeRecente';

export function SuperAdminDashboard() {
  const { t } = useTranslation('painel');
  const { data, isLoading, isError, refetch } = useSuperAdminDashboard();

  if (isLoading) {
    return (
      <CardCarousel label={t('gestao.indicadores')} colunas={4}>
        {[0, 1, 2, 3].map((i) => (
          <KpiCard key={i} title="" value="" isLoading />
        ))}
      </CardCarousel>
    );
  }

  if (isError || !data) {
    return (
      <Card padding="lg" accent="danger">
        <p className="text-sm text-slate-700">{t('plataforma.erro')}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 text-sm font-medium text-blue-600 hover:underline"
        >
          {t('plataforma.tentar_novamente')}
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
          {t('plataforma.titulo')}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {t('plataforma.subtitulo')}
        </p>
      </div>

      <CardCarousel label={t('plataforma.indicadores')} colunas={4}>
        <KpiCard
          title={t('plataforma.empresas')}
          value={formatInteiro(data.kpis.totalEmpresas)}
          icon={Building2}
          accent="primary"
          description={t('plataforma.empresas_desc')}
        />
        <KpiCard
          title={t('plataforma.utilizadores')}
          value={formatInteiro(data.kpis.totalUtilizadores)}
          icon={Users}
          description={t('plataforma.utilizadores_desc')}
        />
        <KpiCard
          title={t('plataforma.lojas')}
          value={formatInteiro(data.kpis.totalLojas)}
          icon={Store}
          description={t('plataforma.lojas_desc')}
        />
        <KpiCard
          title={t('plataforma.subscricoes')}
          value={formatInteiro(data.kpis.subscricoesAtivas)}
          icon={ShieldCheck}
          accent="success"
          description={t('plataforma.subscricoes_desc')}
        />
      </CardCarousel>

      <CardCarousel label={t('plataforma.estado_comercial')} colunas={4}>
        <KpiCard
          title={t('plataforma.receita')}
          value={formatMoeda(data.kpis.receitaMensalRecorrente)}
          icon={TrendingUp}
          accent="success"
          description={t('plataforma.receita_desc')}
        />
        <KpiCard
          title={t('plataforma.trials')}
          value={formatInteiro(data.kpis.trialsAExpirar)}
          icon={Hourglass}
          accent={data.kpis.trialsAExpirar > 0 ? 'warning' : 'neutral'}
          description={t('plataforma.trials_desc')}
        />
        <KpiCard
          title={t('plataforma.em_atraso')}
          value={formatInteiro(data.kpis.empresasEmAtraso)}
          icon={AlertTriangle}
          accent={data.kpis.empresasEmAtraso > 0 ? 'warning' : 'neutral'}
          description={t('plataforma.em_atraso_desc')}
        />
        <KpiCard
          title={t('plataforma.suspensas')}
          value={formatInteiro(data.kpis.empresasSuspensas)}
          icon={Ban}
          accent={data.kpis.empresasSuspensas > 0 ? 'danger' : 'neutral'}
          description={t('plataforma.suspensas_desc')}
        />
      </CardCarousel>

      <SuperAdminsCard />

      <ActividadeRecente actividade={data.actividade} />
    </div>
  );
}
