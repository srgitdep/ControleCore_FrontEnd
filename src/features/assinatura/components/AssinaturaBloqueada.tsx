import { Lock, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui';
import { useAuth } from '@/features/auth';
import { useCopy } from '@/shared/hooks/useCopy';

/**
 * O ecrã de uma empresa bloqueada por falta de pagamento (plano §4.15, P2): em vez da
 * aplicação inteira, porque todo o resto responde 403 — mostrar menus que só dão erro seria
 * pior do que dizer claramente o que se passa. Os dados não foram apagados, e é isso que se
 * diz primeiro.
 */
export function AssinaturaBloqueada() {
  const { t } = useTranslation('assinatura');
  const COPY = useCopy();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const sair = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
          <Lock size={22} className="text-rose-600" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">{t('bloqueada.titulo')}</h1>
        <p className="mt-2 text-sm text-slate-600">{t('bloqueada.texto')}</p>
        <p className="mt-2 text-sm text-slate-600">{t('bloqueada.dados')}</p>
        <p className="mt-4 text-sm font-medium text-slate-800">
          {t('bloqueada.contacto', { email: COPY.MARCA.EMAIL })}
        </p>
        <Button variant="outline" className="mt-6 w-full" onClick={sair}>
          <LogOut size={16} />
          {t('bloqueada.sair')}
        </Button>
      </div>
    </div>
  );
}
