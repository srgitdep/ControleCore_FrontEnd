import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui';
import { formatDataRelativa } from '@/shared/utils';
import type { ActividadeDaPlataforma } from '../types';

interface ActividadeRecenteProps {
  actividade: ActividadeDaPlataforma[];
}

/**
 * O que mexeu na plataforma há pouco: adesões, assinaturas, sessões de suporte, empresas.
 * A lista vem pronta do servidor (`GET /relatorios/dashboard/sistema`) — não há consulta
 * própria, por isso os estados de carregamento e de erro são os do painel.
 */
export function ActividadeRecente({ actividade }: ActividadeRecenteProps) {
  const { t } = useTranslation('painel');

  return (
    <Card padding="lg">
      <h3 className="text-[15px] font-semibold text-slate-900">{t('plataforma.actividade')}</h3>

      {actividade.length === 0 ? (
        <div className="mt-4 flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
          <p className="px-4 text-center text-sm text-slate-400">{t('plataforma.actividade_vazio')}</p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {actividade.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">
                  {t(`plataforma.evento.${e.tipo}`)}
                  {e.empresaNome && <span className="font-normal text-slate-500"> · {e.empresaNome}</span>}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {[e.actor, e.detalhe].filter(Boolean).join(' · ') || t('plataforma.actor_desconhecido')}
                </p>
              </div>
              <span className="shrink-0 text-xs text-slate-400">{formatDataRelativa(e.quando)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
