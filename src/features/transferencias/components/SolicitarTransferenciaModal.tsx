import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Package, Search } from 'lucide-react';
import { useDebounce } from '@/shared/hooks';
import { cn } from '@/shared/utils';
import { catalogApi, type Product } from '@/features/produtos';
import { getLojas } from '@/features/lojas/api/lojas.api';

interface SolicitarTransferenciaModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (dados: {
    produtoId: string;
    origemLojaId: string;
    destinoLojaId: string;
    quantidade: number;
    motivo?: string;
  }) => void;
}

/**
 * Solicitar uma transferência directamente, sem passar por uma necessidade — DT01
 * §15.1: "abrir oportunidades reais de transferência" também é uma acção manual, não
 * só uma sugestão do painel de Necessidades.
 *
 * O backend revalida tudo no momento da aprovação (§12): este modal não calcula
 * cedível nem verifica ruptura — só recolhe a intenção.
 */
export function SolicitarTransferenciaModal({
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}: SolicitarTransferenciaModalProps) {
  const [buscaProduto, setBuscaProduto] = useState('');
  const buscaComDebounce = useDebounce(buscaProduto, 300);
  const [produto, setProduto] = useState<Product | null>(null);
  const [origemLojaId, setOrigemLojaId] = useState('');
  const [destinoLojaId, setDestinoLojaId] = useState('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [motivo, setMotivo] = useState('');

  const { data: lojas } = useQuery({ queryKey: ['lojas'], queryFn: getLojas });
  const { data: resultadoProdutos, isFetching } = useQuery({
    queryKey: ['produtos-busca', buscaComDebounce],
    queryFn: () => catalogApi.getProducts({ search: buscaComDebounce, limit: 6 }),
    enabled: buscaComDebounce.trim().length >= 2 && !produto,
  });

  useEffect(() => {
    if (!isOpen) {
      setBuscaProduto('');
      setProduto(null);
      setOrigemLojaId('');
      setDestinoLojaId('');
      setQuantidade(1);
      setMotivo('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const invalido =
    !produto ||
    !origemLojaId ||
    !destinoLojaId ||
    origemLojaId === destinoLojaId ||
    !Number.isFinite(quantidade) ||
    quantidade <= 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Nova transferência</h3>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Produto</label>
            {produto ? (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-800">{produto.nome}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setProduto(null)}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Trocar
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                  placeholder="Pesquisar por nome, SKU ou código de barras..."
                  className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-sm focus:border-slate-400 focus:outline-none"
                />
                {buscaComDebounce.trim().length >= 2 && (
                  <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-100">
                    {isFetching ? (
                      <p className="px-3 py-2 text-xs text-slate-400">A pesquisar...</p>
                    ) : !resultadoProdutos?.data.length ? (
                      <p className="px-3 py-2 text-xs text-slate-400">Sem resultados.</p>
                    ) : (
                      resultadoProdutos.data.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setProduto(p);
                            setBuscaProduto('');
                          }}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                        >
                          {p.nome}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Origem</label>
              <select
                value={origemLojaId}
                onChange={(e) => setOrigemLojaId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm focus:border-slate-400 focus:outline-none"
              >
                <option value="">Seleccione...</option>
                {(lojas ?? []).map((l: { id: string; nome: string }) => (
                  <option key={l.id} value={l.id}>{l.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Destino</label>
              <select
                value={destinoLojaId}
                onChange={(e) => setDestinoLojaId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm focus:border-slate-400 focus:outline-none"
              >
                <option value="">Seleccione...</option>
                {(lojas ?? []).map((l: { id: string; nome: string }) => (
                  <option key={l.id} value={l.id}>{l.nome}</option>
                ))}
              </select>
            </div>
          </div>
          {origemLojaId && destinoLojaId && origemLojaId === destinoLojaId && (
            <p className="text-xs text-rose-500">A origem e o destino não podem ser a mesma loja.</p>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Quantidade</label>
            <input
              type="number"
              min={1}
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Motivo (opcional)</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button
            disabled={invalido || isSubmitting}
            onClick={() =>
              produto &&
              onConfirm({
                produtoId: produto.id,
                origemLojaId,
                destinoLojaId,
                quantidade,
                motivo: motivo.trim() || undefined,
              })
            }
            className={cn(
              'rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800',
              (invalido || isSubmitting) && 'cursor-not-allowed opacity-50',
            )}
          >
            {isSubmitting ? 'A solicitar...' : 'Solicitar'}
          </button>
        </div>
      </div>
    </div>
  );
}
