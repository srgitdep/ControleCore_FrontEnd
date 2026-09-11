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
import {
  avisoDeNuitAoEscrever,
  diagnosticarNuit,
  mensagemDeErro,
} from '@/shared/utils';
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
  const avisoDoNuit = avisoDeNuitAoEscrever(empresa.empresaNuit);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!empresa.empresaNome.trim()) {
      toast.error('O nome da empresa é obrigatório.');
      return;
    }

    const erroDoNuit = diagnosticarNuit(empresa.empresaNuit);
    if (erroDoNuit) {
      toast.error(erroDoNuit);
      return;
    }

    if (!gestor.gestorNome.trim() || !gestor.gestorEmail.trim()) {
      toast.error('O nome e o e-mail do responsável são obrigatórios.');
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
      toast.error(mensagemDeErro(erro, 'Não foi possível submeter o pedido.'));
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
        <Link
          to="/criar-conta"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={15} />
          Voltar
        </Link>

        <header className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <Store size={22} className="text-white" />
          </div>
          <h1 className="mt-3 text-xl font-semibold text-slate-900">
            Pedir adesão ao ControlCore
          </h1>
          <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">
            Para lojas e cadeias de lojas. Analisamos o pedido e, se for aprovado, recebe por
            e-mail o código de acesso e a senha inicial.
          </p>
        </header>

        {/* Dito antes do formulário, e não depois de submeter. */}
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <Info size={14} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs leading-snug text-amber-900">
            <strong className="font-semibold">Este pedido não cria a conta.</strong> Criar uma
            empresa na plataforma implica um plano e um administrador com acesso aos dados — por
            isso passa por análise. Entramos em contacto pelo e-mail que indicar.
          </p>
        </div>

        <form onSubmit={submeter} className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Building2 size={15} className="text-slate-400" />
              A empresa
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Campo
                  etiqueta="Nome da empresa"
                  obrigatorio
                  valor={empresa.empresaNome}
                  onChange={(v) => setEmpresa({ ...empresa, empresaNome: v })}
                  exemplo="Supermercado Xitalha, Lda."
                />
              </div>
              <Campo
                etiqueta="NUIT"
                obrigatorio
                valor={empresa.empresaNuit}
                onChange={(v) => setEmpresa({ ...empresa, empresaNuit: v })}
                exemplo="400 123 456"
                erro={avisoDoNuit}
                ajuda="Nove dígitos. É por ele que evitamos registos duplicados da mesma empresa."
              />
              <Campo
                etiqueta="Cidade"
                valor={empresa.cidade}
                onChange={(v) => setEmpresa({ ...empresa, cidade: v })}
                exemplo="Maputo"
              />
              <Campo
                etiqueta="E-mail da empresa"
                tipo="email"
                obrigatorio
                valor={empresa.empresaEmail}
                onChange={(v) => setEmpresa({ ...empresa, empresaEmail: v })}
                ajuda="O endereço de facturação."
              />
              <Campo
                etiqueta="Telefone"
                valor={empresa.empresaTelefone}
                onChange={(v) => setEmpresa({ ...empresa, empresaTelefone: v })}
                exemplo="+258 84 123 4567"
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <User size={15} className="text-slate-400" />
              Quem vai administrar a conta
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Campo
                etiqueta="Nome"
                obrigatorio
                valor={gestor.gestorNome}
                onChange={(v) => setGestor({ ...gestor, gestorNome: v })}
                exemplo="Amélia Chissano"
              />
              <Campo
                etiqueta="Cargo"
                valor={gestor.gestorCargo}
                onChange={(v) => setGestor({ ...gestor, gestorCargo: v })}
                exemplo="Directora-Geral"
              />
              <Campo
                etiqueta="E-mail"
                tipo="email"
                obrigatorio
                valor={gestor.gestorEmail}
                onChange={(v) => setGestor({ ...gestor, gestorEmail: v })}
                ajuda="Se o pedido for aprovado, é para aqui que vão o código de acesso e a senha inicial."
              />
              <Campo
                etiqueta="Telefone"
                valor={gestor.gestorTelefone}
                onChange={(v) => setGestor({ ...gestor, gestorTelefone: v })}
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <label className="block text-xs font-medium text-slate-700">
              O que precisa resolver
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Temos três lojas em Maputo e queremos stock centralizado."
              className="mt-1 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] leading-snug text-slate-500">
              Opcional, e é o campo que mais ajuda quem analisa o pedido — diz-nos que módulos
              faz sentido activar.
            </p>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              É fornecedor?{' '}
              <Link to="/fornecedor/registar" className="font-medium text-blue-600 hover:underline">
                Registar como fornecedor
              </Link>
            </p>
            <button
              type="submit"
              disabled={aGravar}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {aGravar && <Loader2 size={15} className="animate-spin" />}
              Submeter pedido
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
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 size={24} className="text-emerald-600" />
        </div>

        <h1 className="mt-3 text-lg font-semibold text-slate-900">Pedido recebido</h1>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            A sua referência
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-widest text-slate-900">
            {resultado.referencia}
          </p>
          <p className="mt-2 text-xs leading-snug text-slate-600">
            Guarde-a. Se nos contactar sobre este pedido, é por ela que o encontramos.
          </p>
        </div>

        <div className="mt-5 text-left">
          <p className="text-sm font-medium text-slate-700">O que acontece a seguir:</p>
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
          Voltar ao início
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
