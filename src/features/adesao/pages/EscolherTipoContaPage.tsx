import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Store, Truck } from 'lucide-react';

/**
 * A bifurcação: comprador ou fornecedor.
 *
 * ## Porque este ecrã existe em vez de um formulário só
 *
 * Os dois registos criam coisas diferentes e seguem caminhos diferentes.
 *
 * O do **comprador** cria um pedido de adesão que alguém tem de aprovar — porque a aprovação
 * provisiona um tenant: uma base de vendas, um plano facturável, e um administrador com
 * acesso a dados que passarão a ser de um cliente real. Deixar isso acontecer directamente
 * de um formulário público seria deixar qualquer visitante provisionar um cliente, e não há
 * como desfazer depois de o e-mail com a senha sair.
 *
 * O do **fornecedor** cria a conta na hora, porque o que ela dá acesso é a uma vitrine
 * vazia. O que um fornecedor tem de esperar é a verificação dos documentos, e essa acontece
 * depois — com ele já dentro, a preencher o catálogo.
 *
 * Um formulário único com um selector teria de mudar metade dos campos, o texto do botão, e
 * a página seguinte. São dois fluxos; este ecrã diz isso em vez de o esconder.
 *
 * ## As duas frases que fazem a escolha
 *
 * «Vendo aos meus clientes» e «Vendo a outras empresas» — em vez de «comprador» e
 * «fornecedor», que é vocabulário da plataforma e não de quem chega. Um retalhista pensa em
 * si como quem vende, não como quem compra, e a etiqueta «comprador» manda-o para o lado
 * errado.
 */
export function EscolherTipoContaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Criar conta no ControlCore</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
            Duas formas de estar na plataforma. Escolha a que descreve o seu negócio — o
            registo é diferente em cada caso.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <Opcao
            icone={<Store size={22} />}
            titulo="Tenho uma loja ou cadeia de lojas"
            frase="Vendo aos meus clientes"
            descricao="Gestão de caixa, stock, compras e contabilidade. Cada loja registada no sistema é um comprador, e pode requisitar a fornecedores da plataforma."
            pontos={[
              'Caixa, stock e armazéns em vários locais',
              'Requisições comparadas entre fornecedores',
              'Pedido analisado antes de a conta ser criada',
            ]}
            destino="/criar-conta/comprador"
            botao="Pedir adesão"
            realce
          />

          <Opcao
            icone={<Truck size={22} />}
            titulo="Sou fornecedor ou distribuidor"
            frase="Vendo a outras empresas"
            descricao="Publique o catálogo e os preços uma vez e fique visível a todos os compradores da plataforma. Não paga para se registar."
            pontos={[
              'Vitrine com artigos, preços e escalões',
              'Aparece nas comparações de quem compra',
              'Conta criada na hora, por e-mail',
            ]}
            destino="/fornecedor/registar"
            botao="Registar a minha empresa"
          />
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Entrar no ControlCore
          </Link>
          <span className="mx-2 text-slate-300">·</span>
          <Link to="/fornecedor/entrar" className="font-medium text-blue-600 hover:underline">
            Entrar no portal do fornecedor
          </Link>
        </p>

        {/* O mercado público é a razão pela qual alguém chega aqui sem ter conta. Deixar a
            porta aberta para o ver antes de decidir custa um link e evita a saída de quem
            ainda não está pronto a preencher um formulário. */}
        <p className="mt-3 text-center text-xs text-slate-400">
          Só a explorar?{' '}
          <Link to="/mercado" className="hover:underline">
            Ver os fornecedores da plataforma
          </Link>
        </p>
      </div>
    </div>
  );
}

function Opcao({
  icone,
  titulo,
  frase,
  descricao,
  pontos,
  destino,
  botao,
  realce,
}: {
  icone: React.ReactNode;
  titulo: string;
  frase: string;
  descricao: string;
  pontos: string[];
  destino: string;
  botao: string;
  realce?: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-xl border bg-white p-5 ${
        realce ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          realce ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
        }`}
      >
        {icone}
      </div>

      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">{frase}</p>
      <h2 className="mt-0.5 text-base font-semibold text-slate-900">{titulo}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{descricao}</p>

      <ul className="mt-4 space-y-1.5">
        {pontos.map((p) => (
          <li key={p} className="flex gap-2 text-xs leading-snug text-slate-600">
            <Building2 size={12} className="mt-0.5 shrink-0 text-slate-300" />
            {p}
          </li>
        ))}
      </ul>

      <Link
        to={destino}
        className={`mt-5 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium ${
          realce
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
        }`}
      >
        {botao}
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}
