import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Loader2, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { mensagemDeErro } from '@/shared/utils';
import { useContaClienteStore } from '../store/useContaClienteStore';
import { GoogleLoginBotao } from '../components/GoogleLoginBotao';
import { VoltarLink } from '../components/VoltarLink';

/**
 * A entrada na conta de cliente — ecrã próprio, molde de `EntrarPortalPage`.
 *
 * Sempre com `lojaId` na rota: a conta é da pessoa e vale em qualquer loja, mas o cliente chega aqui
 * a partir de uma loja, e é para essa loja que volta depois de entrar. O `lojaId` já não escolhe a
 * conta (procura-se em todas as empresas); só diz a que loja regressar.
 */
export function EntrarContaPage() {
  const { lojaId } = useParams<{ lojaId: string }>();
  const navegar = useNavigate();
  const localizacao = useLocation();
  const entrar = useContaClienteStore((s) => s.entrar);
  const { t } = useTranslation('loja');

  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [aEntrar, setAEntrar] = useState(false);

  if (!lojaId) return null;

  const destino = (localizacao.state as { de?: string } | null)?.de ?? `/loja/${lojaId}`;

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setAEntrar(true);

    try {
      await entrar(lojaId, identificador.trim(), password);
      navegar(destino, { replace: true });
    } catch (erro) {
      toast.error(mensagemDeErro(erro, t('conta.erro_entrar')));
    } finally {
      setAEntrar(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <VoltarLink to={`/loja/${lojaId}`}>{t('navegacao.voltar_catalogo')}</VoltarLink>

        <header className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <Store size={22} className="text-white" />
          </div>
          <h1 className="mt-3 text-lg font-semibold text-slate-900">{t('conta.entrar_titulo')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('conta.entrar_subtitulo')}</p>
        </header>

        <GoogleLoginBotao lojaId={lojaId} destino={destino} />

        <form onSubmit={submeter} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div>
            <label className="block text-xs font-medium text-slate-700">{t('conta.campo_identificador')}</label>
            <input
              type="text"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              required
              autoComplete="username"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">{t('conta.campo_senha')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={aEntrar}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {aEntrar && <Loader2 size={15} className="animate-spin" />}
            {t('conta.entrar')}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          {t('conta.sem_conta')}{' '}
          <Link to={`/loja/${lojaId}/criar-conta`} className="font-medium text-blue-600 hover:underline">
            {t('conta.criar')}
          </Link>
        </p>
      </div>
    </div>
  );
}
