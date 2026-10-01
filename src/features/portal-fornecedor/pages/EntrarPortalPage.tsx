import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { SelectorIdioma } from '@/shared/ui';
import { mensagemDeErro } from '@/shared/utils';
import { usePortalStore } from '../store/usePortalStore';

/**
 * A entrada no portal do fornecedor.
 *
 * ## Porque é um ecrã separado do login do ControlCore
 *
 * O `LoginPage` pede um **código de funcionário** — o identificador interno de quem trabalha
 * numa empresa compradora. Um fornecedor não tem nenhum, e nunca vai ter.
 *
 * Mandá-lo para lá — que é o que o interceptor de 401 partilhado faria — punha-o diante de um
 * formulário onde nunca conseguiria entrar, sem nada que lhe explicasse porquê. Daí o ecrã
 * próprio, e daí a instância de axios própria em `portal.api.ts`.
 */
export function EntrarPortalPage() {
  const { t } = useTranslation('portal');
  const navegar = useNavigate();
  const entrar = usePortalStore((s) => s.entrar);

  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [aEntrar, setAEntrar] = useState(false);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setAEntrar(true);

    try {
      await entrar(identificador.trim(), password);
      navegar('/fornecedor', { replace: true });
    } catch (erro: any) {
      // O backend responde sempre «Credenciais inválidas» — não distingue e-mail inexistente
      // de senha errada, para não servir de oráculo sobre quem está na plataforma. A
      // mensagem é mostrada como vem.
      toast.error(mensagemDeErro(erro, t('entrar.erro_entrar')));
    } finally {
      setAEntrar(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-end">
          <SelectorIdioma />
        </div>

        <Link
          to="/criar-conta"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={15} />
          {t('comum.voltar')}
        </Link>

        <header className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <Store size={22} className="text-white" />
          </div>
          <h1 className="mt-3 text-lg font-semibold text-slate-900">{t('comum.portal_fornecedor')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('entrar.subtitulo')}</p>
        </header>

        <form
          onSubmit={submeter}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
        >
          {/*
            Um campo só para os dois identificadores.

            `type="text"` e não `email`: a validação do browser recusaria `F4821` por não
            ter arroba, e o formulário nem chegaria a submeter — o código ficaria a parecer
            inválido sem nenhuma mensagem que o explicasse.

            Dois campos com um selector obrigariam a pessoa a classificar o próprio
            identificador antes de o escrever, e errar a escolha dá «credenciais inválidas»
            sobre credenciais que estavam certas.
          */}
          <div>
            <label className="block text-xs font-medium text-slate-700">
              {t('entrar.identificador')}
            </label>
            <input
              type="text"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              required
              autoComplete="username"
              placeholder={t('entrar.identificador_exemplo')}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] leading-snug text-slate-500">
              {t('entrar.identificador_ajuda')}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">{t('entrar.senha')}</label>
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
            {t('entrar.entrar')}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          {t('entrar.ainda_sem_conta')}{' '}
          <Link to="/fornecedor/registar" className="font-medium text-blue-600 hover:underline">
            {t('entrar.registar_empresa')}
          </Link>
        </p>

        {/* O portal e o ControlCore são dois sistemas para duas pessoas diferentes. Sem esta
            saída, quem chega aqui por engano — um utilizador da empresa compradora que abriu
            o link errado — fica sem forma de voltar. */}
        <p className="mt-2 text-center text-xs text-slate-400">
          {t('entrar.utilizador_comprador')}{' '}
          <Link to="/login" className="hover:underline">
            {t('entrar.entrar_controlcore')}
          </Link>
        </p>
      </div>
    </div>
  );
}
