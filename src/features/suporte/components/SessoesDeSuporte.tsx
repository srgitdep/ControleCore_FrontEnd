import { LifeBuoy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { localeIntl } from '@/i18n';
import { Card } from '@/shared/ui';
import { mensagemDeErro } from '@/shared/utils';
import { useSessoesDeSuporte } from '../hooks/useSuporte';

/**
 * As visitas da plataforma à empresa (plano §4.15, S3): quem entrou, quando, porquê e se
 * podia escrever. É o que torna o modo suporte aceitável para o cliente — alguém da
 * plataforma pode ver os dados dele, e ele pode ver quando o fez.
 */
export function SessoesDeSuporte() {
  const { t } = useTranslation('suporte');
  const { data, isLoading, isError, error, refetch } = useSessoesDeSuporte();
  const quando = (iso: string) => new Date(iso).toLocaleString(localeIntl());

  return (
    <Card padding="lg">
      <h3 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
        <LifeBuoy size={16} />
        {t('sessoes.titulo')}
      </h3>
      <p className="mt-1 text-sm text-slate-500">{t('sessoes.subtitulo')}</p>

      <div className="mt-4">
        {isLoading ? (
          <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
        ) : isError ? (
          <p className="text-sm text-rose-700">
            {mensagemDeErro(error, t('sessoes.erro'))}{' '}
            <button type="button" onClick={() => refetch()} className="underline">
              {t('sessoes.tentar_novamente')}
            </button>
          </p>
        ) : !data?.length ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-400">
            {t('sessoes.vazio')}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.map((s) => (
              <li key={s.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{s.quem.name}</span>
                  <span className="font-mono text-xs text-slate-500">{s.quem.code}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${
                      s.escrita ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {s.escrita ? t('sessoes.com_escrita') : t('sessoes.so_leitura')}
                  </span>
                </div>
                <p className="mt-0.5 text-slate-600">{s.motivo}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {quando(s.iniciadaEm)}
                  {s.terminadaEm ? ` → ${quando(s.terminadaEm)}` : ` → ${t('sessoes.expirou_ou_aberta')}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
