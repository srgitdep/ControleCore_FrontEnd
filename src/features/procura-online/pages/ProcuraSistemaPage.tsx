import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Globe2 } from 'lucide-react';
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
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
            <Globe2 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('sistema.titulo')}</h1>
            <p className="text-sm text-slate-500">{t('sistema.subtitulo')}</p>
          </div>
        </div>

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
      </header>

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
