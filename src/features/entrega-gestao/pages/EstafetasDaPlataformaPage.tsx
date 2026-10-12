import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, FileText, Power } from 'lucide-react';
import { cn } from '@/shared/utils';
import { BarraDaPagina } from '@/shared/ui';
import { DocumentosDoEstafeta } from '../components/DocumentosDoEstafeta';
import { useActividadeDaPlataforma, useEstafetasDaPlataforma } from '../hooks/useOperacao';

/**
 * Os estafetas da plataforma (plano §4.9): os que se registaram sem convite e não são de nenhuma empresa. **Só o Super
 * Admin** — o servidor também o exige. Aqui vê-se quem são, os seus documentos, e suspende-se quem for preciso; a
 * activação é ao submeter o registo, não há fila de aprovação.
 */
export function EstafetasDaPlataformaPage() {
  const { t } = useTranslation('entrega');
  const [inactivos, setInactivos] = useState(false);
  const estafetas = useEstafetasDaPlataforma(inactivos);
  const actividade = useActividadeDaPlataforma();
  const [aVer, setAVer] = useState<string | null>(null);

  const alternar = (id: string, nome: string, activo: boolean) => {
    if (activo && !window.confirm(t('plataforma.suspender_confirmar', { nome }))) return;
    actividade.mutate({ id, isActive: !activo });
  };

  return (
    <div className="space-y-5">
      <BarraDaPagina
        acoes={
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={inactivos} onChange={(e) => setInactivos(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            {t('estafetas.mostrar_inactivos')}
          </label>
        }
      />
      <p className="text-xs text-slate-500">{t('plataforma.ajuda')}</p>

      {estafetas.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : estafetas.isError ? (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle size={16} />
          {t('estafetas.erro')}
        </p>
      ) : estafetas.data && estafetas.data.length > 0 ? (
        <ul className="space-y-2.5">
          {estafetas.data.map((e) => (
            <li key={e.id} className={cn('rounded-xl border border-slate-200 bg-white p-4', !e.isActive && 'opacity-60')}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                    {e.nome}
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">{e.codigo}</span>
                    {!e.isActive && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">{t('estafetas.inactivo')}</span>}
                    {e.isActive && e.onlineDesde && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">{t('plataforma.online')}</span>}
                    {e.isActive && !e.onboardingCompletoEm && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">{t('documentos.onboarding_incompleto')}</span>}
                    {e.onboardingCompletoEm && !e.documentosConferidosEm && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-700">{t('documentos.por_conferir_badge')}</span>}
                    {e.documentosConferidosEm && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">{t('documentos.conferido_badge')}</span>}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{[e.telefone, e.email, e.veiculo, e.matricula].filter(Boolean).join(' · ')}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{t('plataforma.entregas_em_curso', { count: e._count.entregas })}</p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-1.5">
                  <button type="button" onClick={() => setAVer(e.id)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    <FileText size={12} />
                    {t('documentos.ver')}
                  </button>
                  <button
                    type="button"
                    disabled={actividade.isPending}
                    onClick={() => alternar(e.id, e.nome, e.isActive)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50',
                      e.isActive ? 'border-rose-300 text-rose-700 hover:bg-rose-50' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
                    )}
                  >
                    <Power size={12} />
                    {e.isActive ? t('plataforma.suspender') : t('estafetas.reactivar')}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">{t('plataforma.vazio')}</p>
      )}

      {aVer && <DocumentosDoEstafeta estafetaId={aVer} ambito="PLATAFORMA" podeConferir aoFechar={() => setAVer(null)} />}
    </div>
  );
}
