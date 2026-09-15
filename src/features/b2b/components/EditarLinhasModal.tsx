import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { catalogApi } from '@/features/produtos';
import { useDebounce } from '@/shared/hooks';
import { b2bApi } from '../api/b2b.api';
import type { Requisicao } from '../api/b2b.api';

interface Props {
  requisicao: Requisicao;
  onClose: () => void;
  onSuccess: () => void;
}

interface LinhaEmEdicao {
  produtoId: string;
  nome: string;
  unidade?: string;
  quantidade: number;
  observacoes?: string;
}

/**
 * Editar as linhas de uma requisição em rascunho.
 *
 * Substitui a lista inteira — é o que `substituirLinhas` faz no backend — e não faz um
 * diff de acrescentar/remover linha a linha. Mais simples de raciocinar, e uma requisição em
 * rascunho ainda não tem nada a proteger contra essa substituição.
 */
export function EditarLinhasModal({ requisicao, onClose, onSuccess }: Props) {
  const [linhas, setLinhas] = useState<LinhaEmEdicao[]>(
    requisicao.linhas.map((l) => ({
      produtoId: l.produtoId,
      nome: l.produto?.nome ?? l.produtoId,
      quantidade: l.quantidade,
      observacoes: l.observacoes ?? undefined,
    })),
  );
  const [pesquisa, setPesquisa] = useState('');
  const [aGravar, setAGravar] = useState(false);

  const pesquisaAtrasada = useDebounce(pesquisa, 300);

  const { data: produtos, isFetching } = useQuery({
    queryKey: ['produtos-requisicao', pesquisaAtrasada],
    queryFn: () => catalogApi.getProducts({ search: pesquisaAtrasada || undefined, limit: 20 }),
    enabled: pesquisaAtrasada.trim().length >= 2,
  });

  const jaAdicionados = useMemo(() => new Set(linhas.map((l) => l.produtoId)), [linhas]);

  const acrescentar = (produto: { id: string; nome: string; unidadeMedida?: string }) => {
    if (jaAdicionados.has(produto.id)) {
      toast.error(`«${produto.nome}» já está na lista. Altere a quantidade dessa linha.`);
      return;
    }

    setLinhas((actuais) => [
      ...actuais,
      { produtoId: produto.id, nome: produto.nome, unidade: produto.unidadeMedida, quantidade: 1 },
    ]);
    setPesquisa('');
  };

  const alterarQuantidade = (produtoId: string, quantidade: number) => {
    setLinhas((actuais) =>
      actuais.map((l) => (l.produtoId === produtoId ? { ...l, quantidade } : l)),
    );
  };

  const remover = (produtoId: string) => {
    setLinhas((actuais) => actuais.filter((l) => l.produtoId !== produtoId));
  };

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();

    if (linhas.length === 0) {
      toast.error('A requisição precisa de pelo menos um produto.');
      return;
    }

    const invalida = linhas.find((l) => !(l.quantidade > 0));
    if (invalida) {
      toast.error(`A quantidade de «${invalida.nome}» tem de ser maior do que zero.`);
      return;
    }

    setAGravar(true);
    try {
      await b2bApi.substituirLinhas(
        requisicao.id,
        linhas.map((l) => ({
          produtoId: l.produtoId,
          quantidade: l.quantidade,
          observacoes: l.observacoes,
        })),
      );

      toast.success(`Linhas de ${requisicao.numero} actualizadas.`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao actualizar as linhas.');
    } finally {
      setAGravar(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
      <form onSubmit={submeter} className="my-4 w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Editar linhas — {requisicao.numero}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">{requisicao.loja?.nome}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="block text-xs font-medium text-slate-700">Produtos *</label>

            <div className="relative mt-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Escrever o nome do produto…"
                className="w-full rounded-md border border-slate-300 py-2 pl-8 pr-3 text-sm focus:border-blue-500 focus:outline-none"
              />
              {isFetching && (
                <Loader2
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
                />
              )}
            </div>

            {pesquisaAtrasada.trim().length >= 2 && produtos && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-slate-200">
                {produtos.data.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-500">
                    Nenhum produto encontrado para «{pesquisaAtrasada}».
                  </p>
                ) : (
                  produtos.data.map((produto) => (
                    <button
                      key={produto.id}
                      type="button"
                      onClick={() => acrescentar(produto)}
                      disabled={jaAdicionados.has(produto.id)}
                      className="flex w-full items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 text-left text-xs last:border-0 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <span className="truncate text-slate-800">{produto.nome}</span>
                      {jaAdicionados.has(produto.id) ? (
                        <span className="shrink-0 text-[10px] text-slate-400">na lista</span>
                      ) : (
                        <Plus size={12} className="shrink-0 text-blue-600" />
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {linhas.length > 0 && (
              <ul className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-200">
                {linhas.map((linha) => (
                  <li key={linha.produtoId} className="flex items-center gap-2 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-800">
                      {linha.nome}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={linha.quantidade}
                      onChange={(e) =>
                        alterarQuantidade(linha.produtoId, Number(e.target.value))
                      }
                      className="w-20 rounded border border-slate-300 px-2 py-1 text-right text-sm focus:border-blue-500 focus:outline-none"
                    />
                    <span className="w-8 shrink-0 text-[11px] text-slate-400">
                      {linha.unidade ?? 'un'}
                    </span>
                    <button
                      type="button"
                      onClick={() => remover(linha.produtoId)}
                      className="shrink-0 p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 rounded-b-xl border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={aGravar}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {aGravar && <Loader2 size={15} className="animate-spin" />}
            Guardar linhas
          </button>
        </footer>
      </form>
    </div>
  );
}
