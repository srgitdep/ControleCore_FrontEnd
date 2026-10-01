import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Info,
  Loader2,
  Mail,
  Store,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  diagnosticoDoNuit,
  diagnosticoDoNuitAoEscrever,
  mensagemDeErro,
} from '@/shared/utils';
import { SelectorIdioma } from '@/shared/ui';
import { portal } from '../api/portal.api';
import type { RegistoResultado } from '../api/portal.api';

/**
 * O auto-registo do fornecedor — a porta de entrada do mercado.
 *
 * ## Página pública, e é o ponto
 *
 * Um fornecedor que ainda não está na plataforma não tem conta para entrar. Se o registo
 * exigisse alguém do lado do comprador a convidá-lo, o mercado só cresceria à velocidade a
 * que os compradores se lembrassem de convidar — e o efeito de rede nunca arrancaria.
 *
 * ## O NUIT é obrigatório aqui e opcional no cadastro interno
 *
 * `FornecedorOrganizacao.nuit` aceita nulo porque o fornecedor informal sem NUIT é comum e
 * alguém do lado do comprador pode cadastrá-lo assim. No auto-registo é a única coisa que
 * impede a mesma empresa de se registar cinco vezes, e sem deduplicação um mercado aberto
 * enche-se de duplicados na primeira semana.
 *
 * O formulário diz isso por escrito, porque um campo obrigatório sem explicação lê-se como
 * burocracia.
 */
export function RegistarFornecedorPage() {
  const { t } = useTranslation('portal');
  const { t: tComum } = useTranslation('comum');
  const navegar = useNavigate();
  const [aGravar, setAGravar] = useState(false);
  const [resultado, setResultado] = useState<RegistoResultado | null>(null);

  const [empresa, setEmpresa] = useState({
    razaoSocial: '',
    nomeComercial: '',
    nuit: '',
    sede: '',
    telefone: '',
    emailEmpresa: '',
    website: '',
  });

  const [responsavel, setResponsavel] = useState({
    nome: '',
    email: '',
    cargo: '',
    telefone: '',
  });

  /**
   * O aviso do NUIT, enquanto se escreve.
   *
   * Derivado do estado e não guardado noutro: um segundo `useState` para o erro daria
   * duas fontes para a mesma verdade, e a primeira vez que alguém mudasse o NUIT sem
   * passar pelo `onChange` — colar, preencher automaticamente — o aviso ficava obsoleto.
   *
   * `avisoDeNuitAoEscrever` só assinala quando **passou** dos nove dígitos. Um campo a
   * meio não é um erro, e pintá-lo de vermelho ao quarto dígito acusa a pessoa de um
   * engano que ela ainda não cometeu.
   */
  const diagnosticoAoEscrever = diagnosticoDoNuitAoEscrever(empresa.nuit);
  const avisoDoNuit = diagnosticoAoEscrever
    ? tComum(`nuit.${diagnosticoAoEscrever.chave}`, diagnosticoAoEscrever.parametros)
    : null;

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!empresa.razaoSocial.trim()) {
      toast.error(t('comum.razao_social_obrigatoria'));
      return;
    }

    // O diagnóstico completo, e não o de escrita: aqui o campo está terminado, e um NUIT
    // com dígitos a menos passa a ser um erro que tem de ser dito.
    const erroDoNuit = diagnosticoDoNuit(empresa.nuit);
    if (erroDoNuit) {
      toast.error(tComum(`nuit.${erroDoNuit.chave}`, erroDoNuit.parametros));
      return;
    }

    if (!responsavel.email.trim()) {
      toast.error(t('registar.email_responsavel_obrigatorio'));
      return;
    }

    setAGravar(true);
    try {
      const criado = await portal.registar({
        razaoSocial: empresa.razaoSocial.trim(),
        nomeComercial: empresa.nomeComercial.trim() || undefined,
        nuit: empresa.nuit.trim(),
        sede: empresa.sede.trim() || undefined,
        telefone: empresa.telefone.trim() || undefined,
        emailEmpresa: empresa.emailEmpresa.trim() || undefined,
        website: empresa.website.trim() || undefined,
        responsavel: {
          nome: responsavel.nome.trim(),
          email: responsavel.email.trim(),
          cargo: responsavel.cargo.trim() || undefined,
          telefone: responsavel.telefone.trim() || undefined,
        },
      });

      setResultado(criado);
    } catch (erro: any) {
      // O 409 do NUIT já registado traz uma mensagem que explica o que fazer — vale mais
      // mostrá-la do que um «erro ao registar» que não diz nada.
      toast.error(mensagemDeErro(erro, t('registar.erro_registo')));
    } finally {
      setAGravar(false);
    }
  };

  if (resultado) {
    return <RegistoConcluido resultado={resultado} onEntrar={() => navegar('/fornecedor/entrar')} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
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
          <h1 className="mt-3 text-xl font-semibold text-slate-900">
            {t('registar.titulo')}
          </h1>
          <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">
            {t('registar.subtitulo')}
          </p>
        </header>

        <form onSubmit={submeter} className="space-y-4">
          {/* ── Empresa ────────────────────────────────────────────── */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Building2 size={15} className="text-slate-400" />
              {t('comum.a_empresa')}
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Campo
                etiqueta={t('comum.razao_social')}
                obrigatorio
                valor={empresa.razaoSocial}
                onChange={(v) => setEmpresa({ ...empresa, razaoSocial: v })}
                exemplo="Distribuidora Zambeze, Lda"
              />
              <Campo
                etiqueta={t('comum.nome_comercial')}
                valor={empresa.nomeComercial}
                onChange={(v) => setEmpresa({ ...empresa, nomeComercial: v })}
                exemplo="Zambeze"
                ajuda={t('registar.nome_comercial_ajuda')}
              />
              <div className="sm:col-span-2">
                <Campo
                  etiqueta={t('comum.nuit')}
                  obrigatorio
                  valor={empresa.nuit}
                  onChange={(v) => setEmpresa({ ...empresa, nuit: v })}
                  exemplo="400 123 456"
                  erro={avisoDoNuit}
                  ajuda={t('registar.nuit_ajuda')}
                />
              </div>
              <Campo
                etiqueta={t('comum.sede')}
                valor={empresa.sede}
                onChange={(v) => setEmpresa({ ...empresa, sede: v })}
                exemplo="Av. 25 de Setembro, Maputo"
              />
              <Campo
                etiqueta={t('comum.telefone')}
                valor={empresa.telefone}
                onChange={(v) => setEmpresa({ ...empresa, telefone: v })}
                exemplo="+258 84 000 0000"
              />
              <Campo
                etiqueta={t('comum.email_empresa')}
                tipo="email"
                valor={empresa.emailEmpresa}
                onChange={(v) => setEmpresa({ ...empresa, emailEmpresa: v })}
                exemplo="geral@zambeze.co.mz"
              />
              <Campo
                etiqueta={t('comum.website')}
                valor={empresa.website}
                onChange={(v) => setEmpresa({ ...empresa, website: v })}
                exemplo="www.zambeze.co.mz"
              />
            </div>
          </section>

          {/* ── Responsável ────────────────────────────────────────── */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <User size={15} className="text-slate-400" />
              {t('registar.administrar_titulo')}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {t('registar.administrar_nota')}
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Campo
                etiqueta={t('comum.nome')}
                obrigatorio
                valor={responsavel.nome}
                onChange={(v) => setResponsavel({ ...responsavel, nome: v })}
              />
              <Campo
                etiqueta={t('comum.cargo')}
                valor={responsavel.cargo}
                onChange={(v) => setResponsavel({ ...responsavel, cargo: v })}
                exemplo={t('registar.cargo_exemplo')}
              />
              <Campo
                etiqueta={t('registar.email')}
                tipo="email"
                obrigatorio
                valor={responsavel.email}
                onChange={(v) => setResponsavel({ ...responsavel, email: v })}
                ajuda={t('registar.email_ajuda')}
              />
              <Campo
                etiqueta={t('comum.telefone')}
                valor={responsavel.telefone}
                onChange={(v) => setResponsavel({ ...responsavel, telefone: v })}
              />
              {/*
                Sem campos de senha.

                É o servidor que gera o código de acesso e a senha, e envia-os para o
                e-mail acima — o mesmo princípio do onboarding do lado comprador. O que
                isto compra não é conveniência: é que a criação da conta e a posse do
                e-mail passam a ser a mesma coisa. Quem escolhia a senha aqui ficava com
                uma conta activa sem nunca ter provado que o e-mail era seu, e no portal
                do fornecedor o e-mail é o único contacto que existe para verificar
                documentos e avisar de uma adjudicação.
              */}
              <div className="rounded-lg bg-blue-50 px-3 py-2.5 text-xs text-blue-900 sm:col-span-2">
                <strong className="font-semibold">{t('registar.sem_senha_titulo')}</strong>{' '}
                {t('registar.sem_senha_texto')}
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {t('registar.ja_tem_conta')}{' '}
              <Link to="/fornecedor/entrar" className="font-medium text-blue-600 hover:underline">
                {t('registar.entrar_no_portal')}
              </Link>
            </p>
            <button
              type="submit"
              disabled={aGravar}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {aGravar ? <Loader2 size={16} className="animate-spin" /> : null}
              {t('registar.criar_conta')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * O ecrã de confirmação, com o que falta.
 *
 * Os `proximosPassos` vêm do servidor e não são reescritos aqui: são exactamente os
 * requisitos bloqueantes que o sourcing vai exigir, e uma segunda lista no frontend
 * divergiria da primeira na primeira alteração que só um dos lados recebesse.
 *
 * Dizê-los agora é o que impede o fornecedor de se registar e ficar à espera sem saber do
 * quê — que é como se perde um fornecedor entre o registo e a primeira venda.
 */
function RegistoConcluido({
  resultado,
  onEntrar,
}: {
  resultado: RegistoResultado;
  onEntrar: () => void;
}) {
  const { t } = useTranslation('portal');

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 size={24} className="text-emerald-600" />
        </div>

        <h1 className="mt-3 text-lg font-semibold text-slate-900">{t('registar.conta_criada')}</h1>

        {/*
          O código no ecrã e a senha só no e-mail.

          O código é um identificador de login, não um segredo — mostrá-lo aqui poupa a quem
          o e-mail não chegou o ter de repetir o registo, e o NUIT já estaria tomado. A senha
          não aparece: existe no e-mail e em mais nenhum sítio, e é ela que autentica.
        */}
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {t('registar.codigo_titulo')}
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-widest text-slate-900">
            {resultado.codigo}
          </p>
          <p className="mt-2 flex items-start gap-1.5 text-xs leading-snug text-slate-600">
            <Mail size={13} className="mt-0.5 shrink-0 text-slate-400" />
            <span>
              {t('registar.codigo_enviado_antes')} <strong>{t('registar.senha_inicial')}</strong>{' '}
              {t('registar.codigo_enviado_depois')}
            </span>
          </p>
        </div>

        {resultado.reivindicacao ? (
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-left">
            <p className="flex items-start gap-2 text-xs leading-snug text-blue-900">
              <Info size={13} className="mt-0.5 shrink-0" />
              <span>
                <strong>{t('registar.reivindicacao_titulo')}</strong>{' '}
                {t('registar.reivindicacao_texto')}
              </span>
            </p>
          </div>
        ) : null}

        <div className="mt-5 text-left">
          <p className="text-sm font-medium text-slate-700">
            {t('registar.falta_isto')}
          </p>
          <ol className="mt-2 space-y-2">
            {resultado.proximosPassos.map((passo, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-slate-600">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                  {i + 1}
                </span>
                <span className="leading-snug">{passo}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs leading-snug text-slate-500">
            {t('registar.verificacao_nota')}
          </p>
        </div>

        <button
          onClick={onEntrar}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t('registar.entrar_no_portal')}
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

/**
 * Um campo do formulário.
 *
 * `erro` pinta a borda e substitui a ajuda pela mensagem. Substitui em vez de acrescentar:
 * as duas ao mesmo tempo dão quatro linhas de texto debaixo de um campo, e a que importa
 * perde-se no meio.
 */
function Campo({
  etiqueta,
  valor,
  onChange,
  tipo = 'text',
  obrigatorio,
  exemplo,
  ajuda,
  erro,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  tipo?: string;
  obrigatorio?: boolean;
  exemplo?: string;
  ajuda?: string;
  erro?: string | null;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700">
        {etiqueta}
        {obrigatorio && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <input
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        required={obrigatorio}
        placeholder={exemplo}
        // `aria-invalid` e `aria-errormessage` e não só a cor: um leitor de ecrã não vê a
        // borda vermelha, e um campo recusado sem aviso audível é um formulário que não se
        // consegue submeter às cegas.
        aria-invalid={erro ? true : undefined}
        aria-errormessage={erro ? `${etiqueta}-erro` : undefined}
        className={`mt-1 w-full rounded-md border px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none ${
          erro
            ? 'border-red-400 focus:border-red-500'
            : 'border-slate-300 focus:border-blue-500'
        }`}
      />
      {erro ? (
        <p id={`${etiqueta}-erro`} className="mt-1 text-[11px] font-medium leading-snug text-red-600">
          {erro}
        </p>
      ) : ajuda ? (
        <p className="mt-1 text-[11px] leading-snug text-slate-500">{ajuda}</p>
      ) : null}
    </div>
  );
}
