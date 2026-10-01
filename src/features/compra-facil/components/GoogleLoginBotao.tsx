import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { mensagemDeErro } from '@/shared/utils';
import { useContaClienteStore } from '../store/useContaClienteStore';

interface GoogleLoginBotaoProps {
  lojaId: string;
  /** Para onde navegar depois de entrar (ou criar conta, na primeira vez). */
  destino: string;
}

/**
 * "Continuar com Google" — entra ou cria conta, o mesmo botão resolve as duas coisas
 * (Docs/plano_feature_login_google_compra_facil.md). Partilhado por `EntrarContaPage` e
 * `CriarContaPage`: o backend não distingue os dois casos antes de consultar a conta.
 *
 * Sem `VITE_GOOGLE_CLIENT_ID`, não se mostra nada — entrar por e-mail/password continua
 * a funcionar sem este botão.
 */
export function GoogleLoginBotao({ lojaId, destino }: GoogleLoginBotaoProps) {
  const navegar = useNavigate();
  const entrarComGoogle = useContaClienteStore((s) => s.entrarComGoogle);
  const { t } = useTranslation('loja');

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div className="mb-4">
      <GoogleLogin
        text="continue_with"
        shape="rectangular"
        width="320"
        onError={() => toast.error(t('conta.erro_google'))}
        onSuccess={(resposta) => {
          if (!resposta.credential) {
            toast.error(t('conta.erro_google'));
            return;
          }

          entrarComGoogle(lojaId, resposta.credential)
            .then(() => navegar(destino, { replace: true }))
            .catch((erro) => toast.error(mensagemDeErro(erro, t('conta.erro_google'))));
        }}
      />

      <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        {t('conta.ou')}
        <div className="h-px flex-1 bg-slate-200" />
      </div>
    </div>
  );
}
