import { useSuperAdminDashboard } from '@/features/dashboard';
import { Building2, Users, Store, ShieldCheck } from 'lucide-react';
import { Card, CardCarousel, KpiCard } from '@/shared/ui';
import { useTranslation } from 'react-i18next';
import { formatInteiro } from '@/shared/utils';

export function SuperAdminDashboard() {
  const { t } = useTranslation('painel');
  const { data, isLoading } = useSuperAdminDashboard();

  if (isLoading) {
    return (
      <CardCarousel label={t('gestao.indicadores')} colunas={4}>
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

      <Card padding="lg">
        <h3 className="text-[15px] font-semibold text-slate-900">
          {t('plataforma.actividade')}
        </h3>
        <div className="mt-4 flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
          <p className="px-4 text-center text-sm text-slate-400">
            {t('plataforma.actividade_vazio')}
          </p>
        </div>
      </Card>
    </div>
  );
}
