import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Search, ShoppingCart, UserCircle2 } from 'lucide-react';
import { useContaClienteStore } from '../store/useContaClienteStore';
import { useCarrinhoStore } from '../store/useCarrinhoStore';

interface LojaTopoProps {
  lojaId: string;
  lojaNome?: string;
  busca?: string;
  onBuscaChange?: (valor: string) => void;
}

/**
 * O cabeçalho comum a todos os ecrãs de uma loja: nome, pesquisa, carrinho e conta.
 *
 * Um componente só porque as quatro páginas (catálogo, produto, carrinho, pedidos)
 * precisavam da mesma barra — repeti-la em cada uma divergiria na primeira alteração.
 */
export function LojaTopo({ lojaId, lojaNome, busca, onBuscaChange }: LojaTopoProps) {
  const navegar = useNavigate();
  const { cliente, autenticado, sair } = useContaClienteStore();
  const totalItens = useCarrinhoStore((s) => s.itens.reduce((acc, i) => acc + i.quantidade, 0));

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="cc-caixa flex flex-wrap items-center gap-3 py-3">
        <Link to={`/loja/${lojaId}`} className="shrink-0 font-semibold text-slate-900">
          {lojaNome ?? 'A minha loja'}
        </Link>

        {onBuscaChange && (
          <div className="relative min-w-[180px] flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={busca ?? ''}
              onChange={(e) => onBuscaChange(e.target.value)}
              placeholder="Pesquisar produtos…"
              className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {autenticado ? (
            <>
              <Link
                to={`/loja/${lojaId}/pedidos`}
                className="hidden text-sm text-slate-600 hover:text-blue-600 sm:inline"
              >
                Os meus pedidos
              </Link>
              <button
                type="button"
                onClick={() => void sair().then(() => navegar(`/loja/${lojaId}`))}
                title={cliente?.nome}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
              >
                <UserCircle2 size={14} />
                <span className="hidden sm:inline">{cliente?.nome?.split(' ')[0]}</span>
                <LogOut size={13} />
              </button>
            </>
          ) : (
            <Link
              to={`/loja/${lojaId}/entrar`}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <UserCircle2 size={14} />
              Entrar
            </Link>
          )}

          <Link
            to={`/loja/${lojaId}/carrinho`}
            className="relative inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            <ShoppingCart size={14} />
            Carrinho
            {totalItens > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {totalItens}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
