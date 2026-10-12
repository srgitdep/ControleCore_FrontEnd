import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { BarraDaPagina } from '@/shared/ui';
import { PainelDaProcura } from '../components/PainelDaProcura';
import { useProcuraSistema } from '../hooks/useProcura';

const PERIODOS = [7, 30, 90, 365] as const;

/**
 * A procura online de **toda a plataforma**, entre empresas — a visão macro do Super Admin, de onde
 * sairá o futuro tráfego pago (plano §4.4). O servidor só a serve a `SUPER_ADMIN_ONLY`; esconder a
 * rota no menu é conforto, não autorização.
 */
export function ProcuraSistemaPage() {
  const { t } = useTranslation('procura');
  const [dias, setDias] = useState<number>(30);
  const procura = useProcuraSistema(dias);

  return (
    <div className="space-y-5">
      <BarraDaPagina
        acoes={
          <select
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            aria-label={t('filtro.periodo')}
          >
            {PERIODOS.map((d) => (
              <option key={d} value={d}>
                {t('filtro.ultimos', { dias: d })}
              </option>
            ))}
          </select>
        }
      />

      {procura.isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      ) : procura.isError ? (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle size={16} />
          {t('erro')}
        </p>
      ) : procura.data ? (
        <PainelDaProcura relatorio={procura.data} />
      ) : null}
    </div>
  );
}
