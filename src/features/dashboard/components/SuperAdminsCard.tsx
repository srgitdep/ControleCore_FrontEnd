import { useState } from 'react';
import { ShieldPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/shared/ui';
import { mensagemDeErro } from '@/shared/utils';
import { useSuperAdmins } from '../hooks/useDashboard';
import { NovoSuperAdminDialog } from './NovoSuperAdminDialog';

export function SuperAdminsCard() {
  const { t } = useTranslation('painel');
  const { data, isLoading, isError, error, refetch } = useSuperAdmins();
  const [aCriar, setACriar] = useState(false);

  return (
    <Card padding="lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900">{t('super_admins.titulo')}</h3>
          <p className="mt-1 text-sm text-slate-500">{t('super_admins.subtitulo')}</p>
        </div>
        <Button onClick={() => setACriar(true)} className="w-full sm:w-auto">
          <ShieldPlus size={16} />
          {t('super_admins.adicionar')}
        </Button>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <ul className="space-y-2">
            {[0, 1].map((i) => (
              <li key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </ul>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 p-4 text-center">
            <p className="text-sm text-rose-700">{mensagemDeErro(error, t('super_admins.erro_listar'))}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {t('super_admins.tentar_novamente')}
            </Button>
          </div>
        ) : !data?.length ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-400">
            {t('super_admins.vazio')}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.map((sa) => (
              <li key={sa.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{sa.name}</p>
                  <p className="truncate text-xs text-slate-500">{sa.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-xs text-slate-500">{sa.code}</span>
                  {!sa.isActive && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                      {t('super_admins.inactivo')}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {aCriar && <NovoSuperAdminDialog onClose={() => setACriar(false)} />}
    </Card>
  );
}
