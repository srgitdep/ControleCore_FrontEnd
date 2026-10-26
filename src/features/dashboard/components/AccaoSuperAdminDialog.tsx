import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import { mensagemDeErro } from '@/shared/utils';
import { useGerirSuperAdmin } from '../hooks/useDashboard';
import type { SenhaSuperAdminReposta, SuperAdminResumo } from '../types';
import { CredenciaisSuperAdmin } from './CredenciaisSuperAdmin';

export type AccaoSuperAdmin = 'desactivar' | 'reactivar' | 'repor_senha' | 'repor_mfa';

interface AccaoSuperAdminDialogProps {
  alvo: SuperAdminResumo;
  accao: AccaoSuperAdmin;
  onClose: () => void;
}

/**
 * A confirmação de uma acção sobre a conta de outro Super Admin.
 *
 * Todas pedem confirmação: são as contas que vêem todas as empresas, e um clique errado
 * tranca alguém fora ou deixa uma senha antiga sem efeito. Desactivar e reactivar pedem
 * também o motivo, que o servidor guarda no histórico da conta.
 */
export function AccaoSuperAdminDialog({ alvo, accao, onClose }: AccaoSuperAdminDialogProps) {
  const { t } = useTranslation('painel');
  const { alterarEstado, reporSenha, reporMfa } = useGerirSuperAdmin();
  const [motivo, setMotivo] = useState('');
  const [senhaNova, setSenhaNova] = useState<SenhaSuperAdminReposta | null>(null);

  const pedeMotivo = accao === 'desactivar' || accao === 'reactivar';
  const aCorrer = alterarEstado.isPending || reporSenha.isPending || reporMfa.isPending;
  const nome = alvo.name;

  const erro = (e: unknown) => toast.error(mensagemDeErro(e, t('super_admins.erro_accao')));

  const confirmar = () => {
    if (pedeMotivo) {
      alterarEstado.mutate(
        { id: alvo.id, activo: accao === 'reactivar', motivo: motivo.trim() },
        {
          onSuccess: () => {
            toast.success(t('super_admins.estado_alterado', { nome }));
            onClose();
          },
          onError: erro,
        },
      );
    } else if (accao === 'repor_mfa') {
      reporMfa.mutate(alvo.id, {
        onSuccess: () => {
          toast.success(t('super_admins.mfa_reposto', { nome }));
          onClose();
        },
        onError: erro,
      });
    } else {
      reporSenha.mutate(alvo.id, { onSuccess: setSenhaNova, onError: erro });
    }
  };

  const titulo = senhaNova
    ? t('super_admins.senha_reposta_titulo', { nome })
    : t(`super_admins.confirmar_${accao}`, { nome });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">{titulo}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={aCorrer}
            aria-label={t('super_admins.fechar')}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {senhaNova ? (
          <CredenciaisSuperAdmin
            texto={t('super_admins.criado_texto', { nome, email: alvo.email })}
            code={senhaNova.code}
            senha={senhaNova.senhaInicial}
            emailEnviado={senhaNova.emailEnviado}
            onConcluir={onClose}
          />
        ) : (
          <div className="space-y-4 p-6">
            <p className="text-sm text-slate-600">{t(`super_admins.texto_${accao}`)}</p>
            {pedeMotivo && (
              <div>
                <label htmlFor="sa-motivo" className="mb-1 block text-sm font-medium text-slate-700">
                  {t('super_admins.motivo')}
                </label>
                <textarea
                  id="sa-motivo"
                  autoFocus
                  rows={3}
                  maxLength={500}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">{t('super_admins.motivo_dica')}</p>
              </div>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onClose} disabled={aCorrer}>
                {t('super_admins.cancelar')}
              </Button>
              <Button
                variant={accao === 'desactivar' ? 'destructive' : 'default'}
                onClick={confirmar}
                disabled={aCorrer || (pedeMotivo && !motivo.trim())}
              >
                {aCorrer && <Loader2 size={16} className="animate-spin" />}
                {t('super_admins.confirmar')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
