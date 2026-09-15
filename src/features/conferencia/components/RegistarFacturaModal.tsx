import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, FileText, Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/shared/utils';
import { conferenciaApi } from '../api/conferencia.api';
import { suppliersApi } from '@/features/fornecedores';
import { purchasesApi } from '@/features/compras';
import type { PurchaseOrderItem } from '@/features/compras';

const moeda = (valor: number) =>
  valor.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });

interface Linha {
  itemId?: string;
  produtoId?: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  taxaIva?: number;
  desconto?: number;
}

const linhaVazia = (): Linha => ({
  descricao: '',
  quantidade: 1,
  precoUnitario: 0,
  taxaIva: 0,
  desconto: 0,
});

interface RegistarFacturaModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Registar uma factura de fornecedor para entrar em conferência.
 *
 * Escolher um pedido pré-preenche as linhas com o que foi encomendado — o caso comum,
 * porque a factura costuma corresponder a uma ordem de compra. As linhas continuam
 * editáveis: a factura pode divergir do pedido, e é essa divergência que a conferência
 * existe para apanhar.
 */
export function RegistarFacturaModal({ onClose, onSuccess }: RegistarFacturaModalProps) {
  const [loading, setLoading] = useState(false);
  const [fornecedorId, setFornecedorId] = useState('');
  const [pedidoId, setPedidoId] = useState('');
  const [numero, setNumero] = useState('');
  const [dataEmissao, setDataEmissao] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [totalImposto, setTotalImposto] = useState(0);
  const [frete, setFrete] = useState(0);
  const [observacoes, setObservacoes] = useState('');
  const [linhas, setLinhas] = useState<Linha[]>([linhaVazia()]);
  const [isLoadingPedido, setIsLoadingPedido] = useState(false);

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => suppliersApi.getSuppliers(),
  });
  const elegiveis = fornecedores.filter((f) => f.isActive);

  const { data: pedidos = [] } = useQuery({
    queryKey: ['pedidos'],
    queryFn: () => purchasesApi.getOrders(),
  });
  const pedidosDoFornecedor = pedidos.filter((p) => p.fornecedorId === fornecedorId);

  useEffect(() => {
    // Trocar de fornecedor invalida o pedido escolhido — pedidos são sempre de um só.
    setPedidoId('');
  }, [fornecedorId]);

  useEffect(() => {
    if (!pedidoId) return;

    let activo = true;
    setIsLoadingPedido(true);
    purchasesApi
      .getOrderById(pedidoId)
      .then((pedido) => {
        if (!activo) return;
        const linhasDoPedido = (pedido.itens ?? []).map((item: PurchaseOrderItem) => ({
          itemId: item.id,
          produtoId: item.produtoId,
          descricao: item.produto?.nome ?? 'Produto',
          quantidade: item.quantidadePedida,
          precoUnitario: item.custoUnitario,
          taxaIva: item.taxaIva,
          desconto: item.desconto,
        }));
        setLinhas(linhasDoPedido.length > 0 ? linhasDoPedido : [linhaVazia()]);
      })
      .catch(() => {
        if (activo) toast.error('Não foi possível carregar as linhas do pedido.');
      })
      .finally(() => {
        if (activo) setIsLoadingPedido(false);
      });

    return () => {
      activo = false;
    };
  }, [pedidoId]);

  const actualizarLinha = (index: number, campo: keyof Linha, valor: string | number) => {
    setLinhas((antes) => antes.map((l, i) => (i === index ? { ...l, [campo]: valor } : l)));
  };

  const removerLinha = (index: number) => {
    setLinhas((antes) => antes.filter((_, i) => i !== index));
  };

  const linhasValidas = linhas.filter((l) => l.descricao.trim() && l.quantidade > 0);
  const totalLinhas = linhasValidas.reduce(
    (soma, l) => soma + l.quantidade * l.precoUnitario - (l.desconto ?? 0),
    0,
  );
  const totalDeclarado = totalLinhas + totalImposto + frete;

  const submeter = async () => {
    if (!fornecedorId) return toast.error('Escolha o fornecedor.');
    if (!numero.trim()) return toast.error('Indique o número da factura.');
    if (!dataEmissao) return toast.error('Indique a data de emissão.');
    if (linhasValidas.length === 0) {
      return toast.error('Adicione pelo menos uma linha com descrição e quantidade.');
    }

    setLoading(true);
    try {
      await conferenciaApi.registarFactura({
        fornecedorId,
        pedidoId: pedidoId || undefined,
        numero: numero.trim(),
        dataEmissao,
        dataVencimento: dataVencimento || undefined,
        totalDeclarado,
        totalImposto: totalImposto || undefined,
        frete: frete || undefined,
        observacoes: observacoes.trim() || undefined,
        linhas: linhasValidas,
      });

      toast.success('Factura registada. Fica em análise até ser conferida.');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao registar a factura.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Registar factura</h2>
              <p className="text-sm text-slate-500">Entra em análise até ser conferida.</p>
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

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Fornecedor <span className="text-rose-500">*</span>
              </label>
              <select
                value={fornecedorId}
                onChange={(e) => setFornecedorId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
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
                Pedido de compra <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <select
                value={pedidoId}
                onChange={(e) => setPedidoId(e.target.value)}
                disabled={!fornecedorId}
                className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              >
                <option value="">Sem pedido associado</option>
                {pedidosDoFornecedor.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Número da factura <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ex: FT-2026/001"
                className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Emissão <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={dataEmissao}
                  onChange={(e) => setDataEmissao(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Vencimento
                </label>
                <input
                  type="date"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-900">Linhas</h3>
            {isLoadingPedido && (
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                A carregar linhas do pedido...
              </span>
            )}
          </div>

          <div className="space-y-2">
            {linhas.map((linha, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_80px_110px_32px]"
              >
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600 sm:hidden">
                    Descrição
                  </span>
                  <input
                    type="text"
                    value={linha.descricao}
                    onChange={(e) => actualizarLinha(index, 'descricao', e.target.value)}
                    placeholder="Descrição"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600 sm:hidden">
                    Quantidade
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={linha.quantidade}
                    onChange={(e) => actualizarLinha(index, 'quantidade', Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600 sm:hidden">
                    Preço unit.
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={linha.precoUnitario}
                    onChange={(e) =>
                      actualizarLinha(index, 'precoUnitario', Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <button
                  onClick={() => removerLinha(index)}
                  disabled={linhas.length === 1}
                  title="Remover linha"
                  className={cn(
                    'flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors',
                    linhas.length === 1
                      ? 'cursor-not-allowed opacity-30'
                      : 'hover:bg-rose-50 hover:text-rose-600',
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => setLinhas((antes) => [...antes, linhaVazia()])}
            className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            <Plus className="h-4 w-4" /> Adicionar linha
          </button>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Imposto</label>
              <input
                type="number"
                min="0"
                step="any"
                value={totalImposto}
                onChange={(e) => setTotalImposto(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 p-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Frete</label>
              <input
                type="number"
                min="0"
                step="any"
                value={frete}
                onChange={(e) => setFrete(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 p-3 text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">
            Total declarado: <strong className="text-slate-900">{moeda(totalDeclarado)}</strong>
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
              onClick={submeter}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Registar factura
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
