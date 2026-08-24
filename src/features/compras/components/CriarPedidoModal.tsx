import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Loader2, Plus, Trash2, ShoppingBag, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { purchasesApi } from '../api/purchases.api';
import { suppliersApi } from '@/features/fornecedores';
import { catalogApi } from '@/features/produtos';
import { useDebounce } from '@/shared/hooks';
import { cn } from '@/shared/utils';
import { TableScroll } from '@/shared/ui';

const moeda = (valor: number) =>
  valor.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });

/** Uma linha em construção. `nome` é só para mostrar. */
interface Linha {
  produtoId: string;
  nome: string;
  quantidade: number;
  custoUnitario: number;
}

/**
 * Criação de um pedido de compra.
 *
 * ## Porque não existia
 *
 * O botão «Novo Pedido» estava no ecrã desde o início mas **não tinha `onClick`** — e
 * `purchasesApi.createOrder` nunca era chamado em nenhum ponto do frontend. Criar um
 * pedido só era possível pela Mayra (que o fazia sem validações) ou directamente pela
 * API.
 *
 * ## A data prevista tem aviso próprio
 *
 * É opcional no backend, mas sem ela não há forma de medir a pontualidade do
 * fornecedor — a comparação é `dataRececao` contra `dataPrevista`. Deixá-la vazia
 * significa aceitar não saber, e vale a pena dizê-lo em vez de a esconder.
 */
export function CriarPedidoModal({
  linhasIniciais,
  fornecedorIdInicial,
  onClose,
  onCreated,
}: {
  /** Linhas pré-preenchidas, tipicamente vindas da sugestão de compras. */
  linhasIniciais?: Linha[];
  fornecedorIdInicial?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [fornecedorId, setFornecedorId] = useState(fornecedorIdInicial ?? '');
  const [dataPrevista, setDataPrevista] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [linhas, setLinhas] = useState<Linha[]>(linhasIniciais ?? []);
  const [isSaving, setIsSaving] = useState(false);

  const [pesquisa, setPesquisa] = useState('');
  // `useDebounce` devolve o valor, não um par: com destructuring de array sobre uma
  // string, isto ficava com o primeiro carácter — e `undefined` quando vazia, que era
  // o que rebentava em `.trim()` ao abrir o modal.
  const pesquisaAdiada = useDebounce(pesquisa, 350);

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => suppliersApi.getSuppliers(),
  });

  const { data: produtosEncontrados } = useQuery({
    queryKey: ['products', { search: pesquisaAdiada, page: 1, limit: 8 }],
    queryFn: () => catalogApi.getProducts({ search: pesquisaAdiada, page: 1, limit: 8 }),
    // Sem termo não vale trazer o catálogo inteiro para uma lista de sugestões.
    enabled: pesquisaAdiada.trim().length >= 2,
  });

  // Fornecedores suspensos ficam de fora: o backend recusa o pedido, e é melhor não os
  // oferecer do que falhar depois de preencher as linhas.
  const elegiveis = fornecedores.filter((f) => f.isActive);

  const total = linhas.reduce((soma, l) => soma + l.quantidade * l.custoUnitario, 0);

  const acrescentar = (produto: { id: string; nome: string; precoCusto?: number }) => {
    if (linhas.some((l) => l.produtoId === produto.id)) {
      // O backend recusa o pedido inteiro com produtos repetidos; dizê-lo aqui evita a
      // ida ao servidor e identifica qual é.
      return toast.error(`"${produto.nome}" já está no pedido. Ajuste a quantidade.`);
    }

    setLinhas((antes) => [
      ...antes,
      {
        produtoId: produto.id,
        nome: produto.nome,
        quantidade: 1,
        custoUnitario: produto.precoCusto ?? 0,
      },
    ]);
    setPesquisa('');
  };

  const actualizar = (produtoId: string, campo: 'quantidade' | 'custoUnitario', valor: number) => {
    setLinhas((antes) =>
      antes.map((l) => (l.produtoId === produtoId ? { ...l, [campo]: valor } : l)),
    );
  };

  const guardar = async () => {
    if (!fornecedorId) return toast.error('Escolha o fornecedor.');
    if (linhas.length === 0) return toast.error('Acrescente pelo menos um produto.');

    const invalida = linhas.find((l) => !(l.quantidade > 0));
    if (invalida) return toast.error(`A quantidade de "${invalida.nome}" tem de ser maior que zero.`);

    setIsSaving(true);
    try {
      await purchasesApi.createOrder({
        fornecedorId,
        dataPrevista: dataPrevista || undefined,
        observacoes: observacoes.trim() || undefined,
        itens: linhas.map((l) => ({
          produtoId: l.produtoId,
          quantidade: l.quantidade,
          custoUnitario: l.custoUnitario,
          taxaIva: 0,
          desconto: 0,
        })),
      });

      toast.success('Pedido de compra criado em rascunho.');
      onCreated();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao criar o pedido de compra.');
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
              <ShoppingBag className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Novo pedido de compra</h2>
              <p className="text-sm text-slate-500">
                Fica em rascunho — não é enviado ao fornecedor nem afecta o stock.
              </p>
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
          {/* ── Fornecedor e data ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Fornecedor <span className="text-rose-500">*</span>
              </label>
              <select
                value={fornecedorId}
                onChange={(e) => setFornecedorId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Escolher...</option>
                {elegiveis.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Data de entrega combinada
              </label>
              <input
                type="date"
                value={dataPrevista}
                onChange={(e) => setDataPrevista(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
              {!dataPrevista && (
                <p className="mt-1 text-xs text-amber-600">
                  Sem esta data não é possível medir a pontualidade do fornecedor.
                </p>
              )}
            </div>
          </div>

          {/* ── Produtos ─────────────────────────────────────────────────── */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Produtos</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Escrever para procurar um produto..."
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-blue-500"
              />

              {(produtosEncontrados?.data?.length ?? 0) > 0 && (
                <ul className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                  {produtosEncontrados!.data.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => acrescentar(p)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="text-slate-800">{p.nome}</span>
                        <span className="flex items-center gap-2 text-xs text-slate-500">
                          {moeda(p.precoCusto ?? 0)}
                          <Plus size={13} className="text-blue-600" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {linhas.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Nenhum produto no pedido. Procure acima para acrescentar.
              </p>
            ) : (
              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                <TableScroll>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Produto</th>
                      <th className="w-28 px-3 py-2 font-medium">Quantidade</th>
                      <th className="w-32 px-3 py-2 font-medium">Custo unit.</th>
                      <th className="w-28 px-3 py-2 text-right font-medium">Total</th>
                      <th className="w-10 px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {linhas.map((l) => (
                      <tr key={l.produtoId}>
                        <td className="px-3 py-2 font-medium text-slate-800">{l.nome}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={l.quantidade}
                            onChange={(e) =>
                              actualizar(l.produtoId, 'quantidade', Number(e.target.value))
                            }
                            className={cn(
                              'w-full rounded border px-2 py-1 text-sm',
                              l.quantidade > 0 ? 'border-slate-200' : 'border-rose-300',
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
                        <td className="px-3 py-2 text-right text-slate-700">
                          {moeda(l.quantidade * l.custoUnitario)}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() =>
                              setLinhas((antes) => antes.filter((x) => x.produtoId !== l.produtoId))
                            }
                            className="p-1 text-slate-400 hover:text-rose-500"
                            title="Remover linha"
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

          {/* ── Observações ──────────────────────────────────────────────── */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              placeholder="Condições acordadas, referência da proposta..."
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
              disabled={isSaving || !fornecedorId || linhas.length === 0}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              Criar pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
