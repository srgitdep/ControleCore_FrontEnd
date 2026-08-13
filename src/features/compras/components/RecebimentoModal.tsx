import { useEffect, useState } from 'react';
import { X, CheckCircle, Truck, PackageCheck, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { purchasesApi } from '../api/purchases.api';
import type { PurchaseOrder, PurchaseOrderItem } from '../api/purchases.api';
import { useArmazens } from '@/features/lojas';
import { cn } from '@/shared/utils';

const moeda = (valor: number) =>
  valor.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });

interface RecebimentoModalProps {
  order: PurchaseOrder;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Entrada de mercadoria de um pedido de compra.
 *
 * ## Três defeitos que esta versão corrige
 *
 * 1. **O armazém era um campo de texto para escrever o UUID à mão**, com o rótulo
 *    «Armazém de Destino (ID)» e o placeholder `Ex: armazem-principal-id`. Se ficasse
 *    vazio, enviava a string literal `'default-armazem-id'` — que o servidor recusa.
 *    Passa a ser um selector dos armazéns activos.
 * 2. **Forçava recepção total.** Enviava `quantidade: item.quantidadePedida` sem campo
 *    editável, pelo que a recepção parcial que o backend suporta era inalcançável pela
 *    interface. Cada linha passa a ter quantidade editável, limitada ao que falta.
 * 3. **Recebia o pedido da listagem, que não inclui `itens`.** A tabela mostrava
 *    sempre «Nenhum item encontrado neste pedido» e o pedido era enviado com
 *    `itens: []`. Passa a buscar o pedido completo com `getOrderById`.
 */
export function RecebimentoModal({ order, onClose, onSuccess }: RecebimentoModalProps) {
  const [loading, setLoading] = useState(false);
  const [armazemId, setArmazemId] = useState('');
  const [documentoRef, setDocumentoRef] = useState('');

  const { armazens, isLoading: isLoadingArmazens } = useArmazens();

  // A listagem de pedidos não traz `itens` — sem isto a recepção iria vazia.
  const [itens, setItens] = useState<PurchaseOrderItem[]>(order.itens ?? []);
  const [isLoadingItens, setIsLoadingItens] = useState(!order.itens?.length);

  const [quantidades, setQuantidades] = useState<Record<string, number>>({});

  useEffect(() => {
    if (order.itens?.length) return;

    let activo = true;
    purchasesApi
      .getOrderById(order.id)
      .then((completo) => {
        if (activo) setItens(completo.itens ?? []);
      })
      .catch(() => {
        if (activo) toast.error('Não foi possível carregar as linhas do pedido.');
      })
      .finally(() => {
        if (activo) setIsLoadingItens(false);
      });

    return () => {
      activo = false;
    };
  }, [order.id, order.itens]);

  // Por omissão recebe-se o que falta — o caso mais comum — mas cada linha é editável.
  const emFalta = (item: PurchaseOrderItem) => item.quantidadePedida - item.quantidadeRecebida;
  const quantidadeDe = (item: PurchaseOrderItem) => quantidades[item.id] ?? emFalta(item);

  const porReceber = itens.filter((i) => emFalta(i) > 0);
  const total = porReceber.reduce((soma, i) => soma + quantidadeDe(i) * i.custoUnitario, 0);

  const linhaInvalida = porReceber.find((i) => {
    const q = quantidadeDe(i);
    return q < 0 || q > emFalta(i);
  });

  const confirmar = async () => {
    if (!armazemId) return toast.error('Escolha o armazém de destino.');

    const aReceber = porReceber
      .map((i) => ({ item: i, quantidade: quantidadeDe(i) }))
      .filter(({ quantidade }) => quantidade > 0);

    if (aReceber.length === 0) {
      return toast.error('Indique a quantidade recebida de pelo menos um produto.');
    }

    setLoading(true);
    try {
      await purchasesApi.receiveOrder(order.id, {
        armazemId,
        documentoRef: documentoRef.trim() || undefined,
        observacoes: 'Recepção registada na secção Compras',
        itens: aReceber.map(({ item, quantidade }) => ({
          produtoId: item.produtoId,
          quantidade,
          custoUnitario: item.custoUnitario,
        })),
      });

      toast.success('Mercadoria recebida. O stock, o custo médio e as contas a pagar foram actualizados.', {
        duration: 4000,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao confirmar a recepção.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Receber mercadoria</h2>
              <p className="text-sm text-slate-500">
                Pedido #{order.id.slice(0, 8)} · {order.fornecedor?.nome ?? 'fornecedor n/d'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Corpo ──────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Armazém de destino <span className="text-rose-500">*</span>
              </label>
              <select
                value={armazemId}
                onChange={(e) => setArmazemId(e.target.value)}
                disabled={isLoadingArmazens}
                className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              >
                <option value="">
                  {isLoadingArmazens ? 'A carregar armazéns...' : 'Escolher armazém...'}
                </option>
                {armazens.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.etiqueta}
                  </option>
                ))}
              </select>
              {!isLoadingArmazens && armazens.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  Não há armazéns activos. Crie um antes de receber mercadoria.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Documento de referência
              </label>
              <input
                type="text"
                value={documentoRef}
                onChange={(e) => setDocumentoRef(e.target.value)}
                placeholder="Ex: FT-2026/001"
                className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Factura ou guia de remessa. Ajuda a reconciliar depois.
              </p>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-900">Linhas a receber</h3>
            <span className="text-xs text-slate-500">
              Ajuste as quantidades para uma recepção parcial
            </span>
          </div>

          {isLoadingItens ? (
            <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              A carregar as linhas do pedido...
            </div>
          ) : porReceber.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Todas as linhas deste pedido já foram recebidas.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Produto</th>
                    <th className="px-3 py-2.5 text-right font-medium">Falta</th>
                    <th className="w-28 px-3 py-2.5 font-medium">A receber</th>
                    <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">
                      Custo unit.
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {porReceber.map((item) => {
                    const falta = emFalta(item);
                    const quantidade = quantidadeDe(item);
                    const excede = quantidade > falta;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {item.produto?.nome ?? 'Produto desconhecido'}
                          {item.quantidadeRecebida > 0 && (
                            <p className="text-xs text-slate-400">
                              Já recebido: {item.quantidadeRecebida} de {item.quantidadePedida}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-500">{falta}</td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min="0"
                            max={falta}
                            step="any"
                            value={quantidade}
                            onChange={(e) =>
                              setQuantidades((antes) => ({
                                ...antes,
                                [item.id]: Number(e.target.value),
                              }))
                            }
                            className={cn(
                              'w-full rounded border px-2 py-1 text-sm',
                              excede ? 'border-rose-400 bg-rose-50' : 'border-slate-200',
                            )}
                          />
                        </td>
                        <td className="hidden px-3 py-3 text-right text-slate-600 sm:table-cell">
                          {moeda(item.custoUnitario)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {moeda(quantidade * item.custoUnitario)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {linhaInvalida && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              Não é possível receber mais do que o que falta em «
              {linhaInvalida.produto?.nome ?? 'uma das linhas'}». Para receber mais, corrija o
              pedido de compra.
            </p>
          )}

          <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            <PackageCheck className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <p>
              Ao confirmar, o stock do armazém escolhido é aumentado, o custo médio ponderado é
              recalculado e é criada uma conta a pagar a este fornecedor no módulo financeiro.
            </p>
          </div>
        </div>

        {/* ── Rodapé ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">
            Total a receber: <strong className="text-slate-900">{moeda(total)}</strong>
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirmar}
              disabled={loading || !armazemId || porReceber.length === 0 || !!linhaInvalida}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  A processar...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Confirmar recepção
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
