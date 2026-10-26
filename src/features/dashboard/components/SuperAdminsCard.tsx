import { useState, type ReactNode } from 'react';
import { KeyRound, Power, ShieldPlus, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/shared/ui';
import { mensagemDeErro } from '@/shared/utils';
import { useAuth } from '@/features/auth';
import { useSuperAdmins } from '../hooks/useDashboard';
import type { SuperAdminResumo } from '../types';
import { NovoSuperAdminDialog } from './NovoSuperAdminDialog';
import { AccaoSuperAdminDialog, type AccaoSuperAdmin } from './AccaoSuperAdminDialog';

/** Botão de ícone com o nome em `title` e `aria-label`: três acções por linha não cabem em texto num telemóvel. */
function BotaoAccao({ titulo, onClick, children }: { titulo: string; onClick: () => void; children: ReactNode }) {
  return (
    <Button variant="outline" size="icon" title={titulo} aria-label={titulo} onClick={onClick} className="h-8 w-8">
      {children}
    </Button>
  );
}

export function SuperAdminsCard() {
  const { t } = useTranslation('painel');
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useSuperAdmins();
  const [aCriar, setACriar] = useState(false);
  const [accao, setAccao] = useState<{ alvo: SuperAdminResumo; accao: AccaoSuperAdmin } | null>(null);

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
            {data.map((sa) => {
              const propria = sa.id === user?.id;
              return (
                <li key={sa.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{sa.name}</p>
                    <p className="truncate text-xs text-slate-500">{sa.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">{sa.code}</span>
                    <span
                      className={
                        sa.mfaActivo
                          ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700'
                          : 'rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700'
                      }
                    >
                      {sa.mfaActivo ? t('super_admins.mfa_activo') : t('super_admins.mfa_pendente')}
                    </span>
                    {!sa.isActive && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                        {t('super_admins.inactivo')}
                      </span>
                    )}
                    {propria ? (
                      // Sem acções na própria conta: o servidor recusa-as (desactivar-se tranca-se
                      // fora; repor a própria senha ou MFA é o caminho de uma sessão roubada).
                      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] text-white">
                        {t('super_admins.voce')}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1" role="group" aria-label={t('super_admins.accoes', { nome: sa.name })}>
                        <BotaoAccao
                          titulo={sa.isActive ? t('super_admins.desactivar') : t('super_admins.reactivar')}
                          onClick={() => setAccao({ alvo: sa, accao: sa.isActive ? 'desactivar' : 'reactivar' })}
                        >
                          <Power size={14} className={sa.isActive ? 'text-rose-600' : 'text-emerald-600'} />
                        </BotaoAccao>
                        <BotaoAccao
                          titulo={t('super_admins.repor_senha')}
                          onClick={() => setAccao({ alvo: sa, accao: 'repor_senha' })}
                        >
                          <KeyRound size={14} />
                        </BotaoAccao>
                        <BotaoAccao
                          titulo={t('super_admins.repor_mfa')}
                          onClick={() => setAccao({ alvo: sa, accao: 'repor_mfa' })}
                        >
                          <Smartphone size={14} />
                        </BotaoAccao>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {aCriar && <NovoSuperAdminDialog onClose={() => setACriar(false)} />}
      {accao && <AccaoSuperAdminDialog alvo={accao.alvo} accao={accao.accao} onClose={() => setAccao(null)} />}
    </Card>
  );
}
