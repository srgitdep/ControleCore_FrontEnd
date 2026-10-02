import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Info,
  Loader2,
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
import { adesoes, type AdesaoSubmetida } from '../api/adesao.api';

/**
 * O pedido de adesão de um comprador.
 *
 * ## Porque não cria a conta
 *
 * Aprovar um pedido destes provisiona um **tenant**: uma empresa, um administrador com senha,
 * uma assinatura facturável. Este formulário grava um pedido e confirma a recepção; quem
 * decide é um SUPER_ADMIN, e é só na aprovação que a conta nasce e o e-mail com o código sai.
 *
 * O ecrã diz isto por escrito **antes** de o visitante submeter. Prometer acesso imediato e
 * responder «vamos analisar» é a forma mais rápida de perder alguém que estava disposto a
 * esperar se soubesse.
 *
 * ## Cinco campos obrigatórios, e não mais
 *
 * Nome da empresa, NUIT, e-mail da empresa, nome e e-mail do responsável. O resto recolhe-se
 * depois, na configuração — cada campo obrigatório a mais neste ponto é gente que fecha o
 * separador.
 *
 * O NUIT é o que não se dispensa: é a chave que impede dois registos da mesma empresa.
 */
export function PedirAdesaoPage() {
  const { t } = useTranslation('adesao');
  const { t: tComum } = useTranslation('comum');
  const navegar = useNavigate();

  const [aGravar, setAGravar] = useState(false);
  const [resultado, setResultado] = useState<AdesaoSubmetida | null>(null);

  const [empresa, setEmpresa] = useState({
    empresaNome: '',
    empresaNuit: '',
    empresaEmail: '',
    empresaTelefone: '',
    cidade: '',
  });

  const [gestor, setGestor] = useState({
    gestorNome: '',
    gestorEmail: '',
    gestorTelefone: '',
    gestorCargo: '',
  });

  const [observacoes, setObservacoes] = useState('');

  // Ver a nota em `RegistarFornecedorPage`: derivado do estado, e só assinala quando
  // passou dos nove dígitos.
  const diagnosticoAoEscrever = diagnosticoDoNuitAoEscrever(empresa.empresaNuit);
  const avisoDoNuit = diagnosticoAoEscrever
    ? tComum(`nuit.${diagnosticoAoEscrever.chave}`, diagnosticoAoEscrever.parametros)
    : null;

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!empresa.empresaNome.trim()) {
      toast.error(t('pedido.nome_empresa_obrigatorio'));
      return;
    }

    const erroDoNuit = diagnosticoDoNuit(empresa.empresaNuit);
    if (erroDoNuit) {
      toast.error(tComum(`nuit.${erroDoNuit.chave}`, erroDoNuit.parametros));
      return;
    }

    if (!gestor.gestorNome.trim() || !gestor.gestorEmail.trim()) {
      toast.error(t('pedido.responsavel_obrigatorio'));
      return;
    }

    setAGravar(true);
    try {
      const submetido = await adesoes.submeter({
        empresaNome: empresa.empresaNome.trim(),
        empresaNuit: empresa.empresaNuit.trim(),
        empresaEmail: empresa.empresaEmail.trim(),
        empresaTelefone: empresa.empresaTelefone.trim() || undefined,
        cidade: empresa.cidade.trim() || undefined,
        gestorNome: gestor.gestorNome.trim(),
        gestorEmail: gestor.gestorEmail.trim(),
        gestorTelefone: gestor.gestorTelefone.trim() || undefined,
        gestorCargo: gestor.gestorCargo.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      });

      setResultado(submetido);
    } catch (erro: any) {
      // O 409 do NUIT já registado — ou do e-mail que já tem utilizador — traz uma mensagem
      // que explica o caminho alternativo («já é cliente, o que quer é entrar»). Vale mais
      // mostrá-la do que um «erro ao submeter» que não diz nada.
      toast.error(mensagemDeErro(erro, t('pedido.erro_submeter')));
    } finally {
      setAGravar(false);
    }
  };

  if (resultado) {
    return <PedidoRecebido resultado={resultado} onSair={() => navegar('/landing')} />;
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
            {t('pedido.titulo')}
          </h1>
          <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">
            {t('pedido.subtitulo')}
          </p>
        </header>

        {/* Dito antes do formulário, e não depois de submeter. */}
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <Info size={14} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs leading-snug text-amber-900">
            <strong className="font-semibold">{t('pedido.aviso_titulo')}</strong>{' '}
            {t('pedido.aviso_corpo')}
          </p>
        </div>

        <form onSubmit={submeter} className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Building2 size={15} className="text-slate-400" />
              {t('pedido.seccao_empresa')}
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Campo
                  etiqueta={t('pedido.empresa_nome')}
                  obrigatorio
                  valor={empresa.empresaNome}
                  onChange={(v) => setEmpresa({ ...empresa, empresaNome: v })}
                  exemplo={t('pedido.empresa_nome_exemplo')}
                />
              </div>
              <Campo
                etiqueta={t('pedido.nuit')}
                obrigatorio
                valor={empresa.empresaNuit}
                onChange={(v) => setEmpresa({ ...empresa, empresaNuit: v })}
                exemplo={t('pedido.nuit_exemplo')}
                erro={avisoDoNuit}
                ajuda={t('pedido.nuit_ajuda')}
              />
              <Campo
                etiqueta={t('pedido.cidade')}
                valor={empresa.cidade}
                onChange={(v) => setEmpresa({ ...empresa, cidade: v })}
                exemplo={t('pedido.cidade_exemplo')}
              />
              <Campo
                etiqueta={t('pedido.empresa_email')}
                tipo="email"
                obrigatorio
                valor={empresa.empresaEmail}
                onChange={(v) => setEmpresa({ ...empresa, empresaEmail: v })}
                ajuda={t('pedido.empresa_email_ajuda')}
              />
              <Campo
                etiqueta={t('pedido.telefone')}
                valor={empresa.empresaTelefone}
                onChange={(v) => setEmpresa({ ...empresa, empresaTelefone: v })}
                exemplo={t('pedido.telefone_exemplo')}
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <User size={15} className="text-slate-400" />
              {t('pedido.seccao_gestor')}
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Campo
                etiqueta={t('pedido.gestor_nome')}
                obrigatorio
                valor={gestor.gestorNome}
                onChange={(v) => setGestor({ ...gestor, gestorNome: v })}
                exemplo={t('pedido.gestor_nome_exemplo')}
              />
              <Campo
                etiqueta={t('pedido.gestor_cargo')}
                valor={gestor.gestorCargo}
                onChange={(v) => setGestor({ ...gestor, gestorCargo: v })}
                exemplo={t('pedido.gestor_cargo_exemplo')}
              />
              <Campo
                etiqueta={t('pedido.gestor_email')}
                tipo="email"
                obrigatorio
                valor={gestor.gestorEmail}
                onChange={(v) => setGestor({ ...gestor, gestorEmail: v })}
                ajuda={t('pedido.gestor_email_ajuda')}
              />
              <Campo
                etiqueta={t('pedido.telefone')}
                valor={gestor.gestorTelefone}
                onChange={(v) => setGestor({ ...gestor, gestorTelefone: v })}
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <label className="block text-xs font-medium text-slate-700">
              {t('pedido.observacoes')}
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder={t('pedido.observacoes_exemplo')}
              className="mt-1 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] leading-snug text-slate-500">
              {t('pedido.observacoes_ajuda')}
            </p>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {t('pedido.e_fornecedor')}{' '}
              <Link to="/fornecedor/registar" className="font-medium text-blue-600 hover:underline">
                {t('pedido.registar_fornecedor')}
              </Link>
            </p>
            <button
              type="submit"
              disabled={aGravar}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {aGravar && <Loader2 size={15} className="animate-spin" />}
              {t('pedido.submeter')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * A confirmação.
 *
 * Os próximos passos vêm do servidor e não são escritos aqui: são a mesma lista que o e-mail
 * de confirmação leva, e duas cópias divergiriam na primeira alteração que só uma recebesse.
 *
 * A referência aparece porque o e-mail pode demorar, cair no lixo, ou falhar — e esta página
 * é o único canal garantido.
 */
function PedidoRecebido({
  resultado,
  onSair,
}: {
  resultado: AdesaoSubmetida;
  onSair: () => void;
}) {
  const { t } = useTranslation('adesao');

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 size={24} className="text-emerald-600" />
        </div>

        <h1 className="mt-3 text-lg font-semibold text-slate-900">{t('recebido.titulo')}</h1>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {t('recebido.referencia')}
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-widest text-slate-900">
            {resultado.referencia}
          </p>
          <p className="mt-2 text-xs leading-snug text-slate-600">
            {t('recebido.referencia_ajuda')}
          </p>
        </div>

        <div className="mt-5 text-left">
          <p className="text-sm font-medium text-slate-700">{t('recebido.a_seguir')}</p>
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
        </div>

        <button
          onClick={onSair}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {t('recebido.voltar_inicio')}
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

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
        {obrigatorio ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </label>
      <input
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        required={obrigatorio}
        placeholder={exemplo}
        aria-invalid={erro ? true : undefined}
        aria-errormessage={erro ? `${etiqueta}-erro` : undefined}
        className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none ${
          erro
            ? 'border-red-400 focus:border-red-500'
            : 'border-slate-300 focus:border-blue-500'
        }`}
      />
      {erro ? (
        <p
          id={`${etiqueta}-erro`}
          className="mt-1 text-[11px] font-medium leading-snug text-red-600"
        >
          {erro}
        </p>
      ) : ajuda ? (
        <p className="mt-1 text-[11px] leading-snug text-slate-500">{ajuda}</p>
      ) : null}
    </div>
  );
}
