import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Loader2, Plus, Trash2, FileEdit, Search, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { purchasesApi } from '../api/purchases.api';
import type { PurchaseOrder } from '../api/purchases.api';
import { catalogApi } from '@/features/produtos';
import { useDebounce } from '@/shared/hooks';
import { cn } from '@/shared/utils';
import { TableScroll } from '@/shared/ui';

const moeda = (valor: number) =>
  valor.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });

const LIMITE_CATALOGO = 50;

interface Linha {
  produtoId: string;
  nome: string;
  quantidade: number;
  custoUnitario: number;
  taxaIva: number;
  desconto: number;
  /** O que já entrou por recepção — a linha não pode descer abaixo disto. */
  quantidadeRecebida: number;
}

interface Props {
  order: PurchaseOrder;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Alterar as linhas de uma ordem de compra já criada.
 *
 * ## Porque exige motivo
 *
 * A alteração cria uma versão nova — a anterior fica guardada por inteiro — e o motivo é o
 * que explica a alguém que leia o histórico depois porquê. Se a mudança for material
 * (produto, quantidade, preço, IVA, desconto ou fornecedor) numa ordem já aprovada, a
 * aprovação é anulada e ela volta à fila: outra pessoa decide de novo, sobre o que está
 * realmente a ser comprado.
 *
 * ## Porque uma linha recebida não desce
 *
 * Reduzir abaixo do que já entrou por recepção deixaria a ordem a dizer que se comprou
 * menos do que já está fisicamente no armazém. O backend recusa; o campo fica bloqueado
 * aqui para não ensaiar uma submissão que vai falhar.
 */
export function AlterarLinhasPedidoModal({ order, onClose, onSuccess }: Props) {
  const [dataPrevista, setDataPrevista] = useState(order.dataPrevista?.slice(0, 10) ?? '');
  const [observacoes, setObservacoes] = useState(order.observacoes ?? '');
  const [motivo, setMotivo] = useState('');
  const [linhas, setLinhas] = useState<Linha[]>(
    (order.itens ?? []).map((i) => ({
      produtoId: i.produtoId,
      nome: i.produto?.nome ?? 'Produto',
      quantidade: i.quantidadePedida,
      custoUnitario: i.custoUnitario,
      taxaIva: i.taxaIva,
      desconto: i.desconto,
      quantidadeRecebida: i.quantidadeRecebida,
    })),
  );
  const [isSaving, setIsSaving] = useState(false);

  const [pesquisa, setPesquisa] = useState('');
  const [listaAberta, setListaAberta] = useState(false);
  const pesquisaAdiada = useDebounce(pesquisa, 350);
  const termo = pesquisaAdiada.trim();

  const { data: produtosEncontrados, isLoading: aCarregarProdutos } = useQuery({
    queryKey: ['products', { search: termo, page: 1, limit: LIMITE_CATALOGO }],
    queryFn: () => catalogApi.getProducts({ search: termo, page: 1, limit: LIMITE_CATALOGO }),
    placeholderData: (anterior) => anterior,
  });

  const produtos = produtosEncontrados?.data ?? [];
  const totalNoCatalogo = produtosEncontrados?.total ?? 0;
  const escondidos = Math.max(0, totalNoCatalogo - produtos.length);

  const total = linhas.reduce(
    (soma, l) => soma + l.quantidade * l.custoUnitario - l.desconto,
    0,
  );

  const acrescentar = (produto: { id: string; nome: string; precoCusto?: number }) => {
    if (linhas.some((l) => l.produtoId === produto.id)) {
      return toast.error(`"${produto.nome}" já está na ordem. Ajuste a quantidade.`);
    }

    setLinhas((antes) => [
      ...antes,
      {
        produtoId: produto.id,
        nome: produto.nome,
        quantidade: 1,
        custoUnitario: produto.precoCusto ?? 0,
        taxaIva: 0,
        desconto: 0,
        quantidadeRecebida: 0,
      },
    ]);
    setPesquisa('');
  };

  const actualizar = (
    produtoId: string,
    campo: 'quantidade' | 'custoUnitario' | 'taxaIva' | 'desconto',
    valor: number,
  ) => {
    setLinhas((antes) =>
      antes.map((l) => (l.produtoId === produtoId ? { ...l, [campo]: valor } : l)),
    );
  };

  const remover = (linha: Linha) => {
    if (linha.quantidadeRecebida > 0) {
      return toast.error(
        `"${linha.nome}" já tem mercadoria recebida — não pode ser removida da ordem.`,
      );
    }
    setLinhas((antes) => antes.filter((l) => l.produtoId !== linha.produtoId));
  };

  const guardar = async () => {
    if (linhas.length === 0) return toast.error('A ordem precisa de pelo menos um produto.');

    const invalida = linhas.find((l) => !(l.quantidade > 0));
    if (invalida) return toast.error(`A quantidade de "${invalida.nome}" tem de ser maior que zero.`);

    const abaixoDoRecebido = linhas.find((l) => l.quantidade < l.quantidadeRecebida);
    if (abaixoDoRecebido) {
      return toast.error(
        `"${abaixoDoRecebido.nome}" já recebeu ${abaixoDoRecebido.quantidadeRecebida} — não pode pedir menos do que isso.`,
      );
    }

    if (motivo.trim().length < 5) {
      return toast.error('Indique o motivo da alteração — fica registado na versão.');
    }

    setIsSaving(true);
    try {
      await purchasesApi.alterarLinhas(order.id, {
        linhas: linhas.map((l) => ({
          produtoId: l.produtoId,
          quantidadePedida: l.quantidade,
          custoUnitario: l.custoUnitario,
          taxaIva: l.taxaIva,
          desconto: l.desconto,
        })),
        dataPrevista: dataPrevista || undefined,
        observacoes: observacoes.trim() || undefined,
        motivo: motivo.trim(),
      });

      toast.success('Ordem alterada. Uma nova versão foi criada.');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao alterar a ordem.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2">
              <FileEdit className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Alterar pedido #{order.id.slice(0, 8)}
              </h2>
              <p className="text-sm text-slate-500">{order.fornecedor?.nome ?? 'fornecedor n/d'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {order.estadoAprovacao === 'APROVADA' && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              Esta ordem já está aprovada. Se a alteração for material, a aprovação é anulada e
              ela volta a aguardar decisão.
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Data de entrega combinada
            </label>
            <input
              type="date"
              value={dataPrevista}
              onChange={(e) => setDataPrevista(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Produtos</label>
            <div
              className="relative"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setListaAberta(false);
              }}
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                onFocus={() => setListaAberta(true)}
                placeholder="Clicar para ver os produtos, ou escrever para procurar..."
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-blue-500"
              />

              {listaAberta && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                  {aCarregarProdutos && produtos.length === 0 ? (
                    <p className="flex items-center gap-2 px-3 py-3 text-sm text-slate-500">
                      <Loader2 size={14} className="animate-spin" />
                      A carregar produtos...
                    </p>
                  ) : produtos.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-slate-500">
                      {termo
                        ? `Nenhum produto encontrado para "${termo}".`
                        : 'A empresa ainda não tem produtos no catálogo.'}
                    </p>
                  ) : (
                    <>
                      <ul className="max-h-60 overflow-y-auto">
                        {produtos.map((p) => {
                          const jaNaOrdem = linhas.some((l) => l.produtoId === p.id);
                          return (
                            <li key={p.id}>
                              <button
                                type="button"
                                onClick={() => acrescentar(p)}
                                disabled={jaNaOrdem}
                                className={cn(
                                  'flex w-full items-center justify-between px-3 py-2 text-left text-sm',
                                  jaNaOrdem ? 'cursor-default bg-slate-50' : 'hover:bg-slate-50',
                                )}
                              >
                                <span className={jaNaOrdem ? 'text-slate-400' : 'text-slate-800'}>
                                  {p.nome}
                                </span>
                                <span className="flex items-center gap-2 text-xs text-slate-500">
                                  {jaNaOrdem ? (
                                    <span className="text-slate-400">já na ordem</span>
                                  ) : (
                                    <>
                                      {moeda(p.precoCusto ?? 0)}
                                      <Plus size={13} className="text-blue-600" />
                                    </>
                                  )}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>

                      {escondidos > 0 && (
                        <p className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                          A mostrar {produtos.length} de {totalNoCatalogo}. Escreva para
                          encontrar os restantes {escondidos}.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {linhas.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Nenhum produto na ordem.
              </p>
            ) : (
              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                <TableScroll>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">Produto</th>
                        <th className="w-24 px-3 py-2 font-medium">Quantidade</th>
                        <th className="w-28 px-3 py-2 font-medium">Custo unit.</th>
                        <th className="w-20 px-3 py-2 font-medium">IVA %</th>
                        <th className="w-24 px-3 py-2 font-medium">Desconto</th>
                        <th className="w-28 px-3 py-2 text-right font-medium">Total</th>
                        <th className="w-10 px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {linhas.map((l) => (
                        <tr key={l.produtoId}>
                          <td className="px-3 py-2 font-medium text-slate-800">
                            {l.nome}
                            {l.quantidadeRecebida > 0 && (
                              <p className="text-xs font-normal text-slate-400">
                                {l.quantidadeRecebida} já recebida
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={l.quantidadeRecebida}
                              step="any"
                              value={l.quantidade}
                              onChange={(e) =>
                                actualizar(l.produtoId, 'quantidade', Number(e.target.value))
                              }
                              className={cn(
                                'w-full rounded border px-2 py-1 text-sm',
                                l.quantidade >= l.quantidadeRecebida && l.quantidade > 0
                                  ? 'border-slate-200'
                                  : 'border-rose-300',
                              )}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={l.custoUnitario}
                              onChange={(e) =>
                                actualizar(l.produtoId, 'custoUnitario', Number(e.target.value))
                              }
                              className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={l.taxaIva}
                              onChange={(e) =>
                                actualizar(l.produtoId, 'taxaIva', Number(e.target.value))
                              }
                              className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={l.desconto}
                              onChange={(e) =>
                                actualizar(l.produtoId, 'desconto', Number(e.target.value))
                              }
                              className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700">
                            {moeda(l.quantidade * l.custoUnitario - l.desconto)}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => remover(l)}
                              disabled={l.quantidadeRecebida > 0}
                              className="p-1 text-slate-400 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30"
                              title={
                                l.quantidadeRecebida > 0
                                  ? 'Já tem mercadoria recebida'
                                  : 'Remover linha'
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Motivo da alteração <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder="Ex: fornecedor actualizou o preço, cliente pediu mais quantidade..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-3">
          <p className="text-sm text-slate-600">
            {linhas.length} {linhas.length === 1 ? 'linha' : 'linhas'} ·{' '}
            <strong className="text-slate-900">{moeda(total)}</strong>
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={isSaving || linhas.length === 0}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              Guardar alteração
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
