import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/shared/ui';

/**
 * O que aparece quando um ecrã rebenta.
 *
 * ## Porque existe
 *
 * Sem `errorElement`, o React Router mostra o seu ecrã de omissão — que é para quem
 * desenvolve, está em inglês, e despeja uma pilha de chamadas de dentro do próprio React.
 *
 * Pior do que ser feio: a pilha que ele mostra é quase sempre a do **sintoma** e não a da
 * causa. Um erro num componente faz o Router desmontar a árvore, e o que rebenta a seguir é o
 * `removeChild` do React a limpar — que é o que fica no ecrã, enquanto o erro verdadeiro
 * desaparece.
 *
 * Aqui mostra-se o erro tal como é, com a mensagem à frente e a pilha escondida atrás de um
 * clique. E, sobretudo, uma saída: recarregar ou voltar atrás, em vez de um ecrã morto.
 */
export function ErroDaAplicacao() {
  const erro = useRouteError();
  const navegar = useNavigate();

  const { titulo, mensagem, detalhe } = interpretar(erro);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex gap-3">
          <div className="rounded-lg bg-rose-50 p-2">
            <AlertTriangle className="text-rose-600" size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-slate-900">{titulo}</h1>
            <p className="mt-1 text-sm text-slate-600">{mensagem}</p>

            {detalhe && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
                  Detalhe técnico
                </summary>
                {/*
                  Escondido atrás de um clique, mas presente: quem reporta o problema precisa de
                  o poder copiar, e pedir-lhe que reproduza com a consola aberta é pedir-lhe que
                  faça o trabalho duas vezes.
                */}
                <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
                  {detalhe}
                </pre>
              </details>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => window.location.reload()}>
                <RotateCcw size={15} className="mr-1.5" />
                Recarregar
              </Button>
              <Button variant="outline" onClick={() => navegar(-1)}>
                <ArrowLeft size={15} className="mr-1.5" />
                Voltar atrás
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function interpretar(erro: unknown): {
  titulo: string;
  mensagem: string;
  detalhe: string | null;
} {
  // 404 e afins: o Router já sabe distingui-los, e merecem outra frase.
  if (isRouteErrorResponse(erro)) {
    return {
      titulo: erro.status === 404 ? 'Página não encontrada' : `Erro ${erro.status}`,
      mensagem:
        erro.status === 404
          ? 'O endereço não corresponde a nenhum ecrã. Pode ter sido uma ligação antiga.'
          : erro.statusText || 'O servidor recusou o pedido.',
      detalhe: typeof erro.data === 'string' ? erro.data : null,
    };
  }

  if (erro instanceof Error) {
    return {
      titulo: 'Este ecrã não conseguiu carregar',
      mensagem: erro.message,
      detalhe: erro.stack ?? null,
    };
  }

  return {
    titulo: 'Este ecrã não conseguiu carregar',
    mensagem: 'Ocorreu um erro que não trouxe mensagem.',
    detalhe: erro ? String(erro) : null,
  };
}
