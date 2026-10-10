import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { PainelDaProcura } from '../components/PainelDaProcura';
import { useProcura } from '../hooks/useProcura';

const PERIODOS = [7, 30, 90, 365] as const;

const classeSelect =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none';

/**
 * A procura online das lojas da empresa: o que os clientes pedem, de onde, a que horas e com que
 * frequência. A empresa vem do servidor (do token) — esta página nunca a escolhe.
 */
export function ProcuraPage() {
  const { t } = useTranslation('procura');
  const [dias, setDias] = useState<number>(30);
  const [lojaId, setLojaId] = useState<string>('');
  const procura = useProcura({ dias, lojaId: lojaId || undefined });

  // As lojas para o filtro: as que aparecem **sem** filtro. Com uma loja escolhida a lista do servidor
  // encolhe para ela, e o filtro ficaria sem saída.
  const [lojas, setLojas] = useState<Array<{ lojaId: string; nome: string }>>([]);
  useEffect(() => {
    if (!lojaId && procura.data) setLojas(procura.data.lojas.map((l) => ({ lojaId: l.lojaId, nome: l.nome })));
  }, [lojaId, procura.data]);

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <TrendingUp size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('titulo')}</h1>
            <p className="text-sm text-slate-500">{t('subtitulo')}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lojas.length > 1 && (
            <select value={lojaId} onChange={(e) => setLojaId(e.target.value)} className={classeSelect} aria-label={t('filtro.loja')}>
              <option value="">{t('filtro.todas_lojas')}</option>
              {lojas.map((l) => (
                <option key={l.lojaId} value={l.lojaId}>
                  {l.nome}
                </option>
              ))}
            </select>
          )}
          <select value={dias} onChange={(e) => setDias(Number(e.target.value))} className={classeSelect} aria-label={t('filtro.periodo')}>
            {PERIODOS.map((d) => (
              <option key={d} value={d}>
                {t('filtro.ultimos', { dias: d })}
              </option>
            ))}
          </select>
        </div>
      </header>

      {procura.isLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        </div>
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
