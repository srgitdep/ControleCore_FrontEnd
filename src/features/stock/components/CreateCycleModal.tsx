import { useState } from 'react';
import { X, ClipboardList, MapPin } from 'lucide-react';
import { useCreateCycle } from '@/features/stock';
import { useArmazens } from '@/features/lojas';
import { useLocalizacoes, LocalizacoesPanel } from '@/features/armazens';
import { Button } from '@/shared/ui';

interface CreateCycleModalProps {
  onClose: () => void;
  onCreated?: (cycleId: string) => void;
}

/**
 * Novo ciclo de inventário (§5): ao criar, o backend carrega automaticamente
 * o perímetro — toda posição de `StockLocalizacao` deste armazém entra no
 * ciclo como PENDENTE. Por isso o armazém é obrigatório: sem localizações
 * com mercadoria atribuída não há perímetro a carregar.
 *
 * A atribuição de quantidade a uma prateleira (`StockLocalizacao`) não se faz
 * aqui — é `LocalizacaoStockModal`, acessível a partir da ficha de cada
 * posição em Stock. Este modal só cobre o primeiro passo (criar as
 * localizações em si); o aviso abaixo orienta para o segundo.
 */
export function CreateCycleModal({ onClose, onCreated }: CreateCycleModalProps) {
  const [name, setName] = useState('');
  const [armazemId, setArmazemId] = useState('');
  const [gerirLocalizacoesAberto, setGerirLocalizacoesAberto] = useState(false);
  const { armazens, isLoading: isLoadingArmazens } = useArmazens();
  const { mutate: createCycle, isPending, error } = useCreateCycle();
  const { data: arvore } = useLocalizacoes(armazemId || undefined);

  const armazemSelecionado = armazens.find((a) => a.id === armazemId);
  const totalLocalizacoes = arvore?.total ?? 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !armazemId) return;
    createCycle(
      { name: name.trim(), armazemId },
      { onSuccess: (cycle) => (onCreated ? onCreated(cycle.id) : onClose()) },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Novo Ciclo de Inventário</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="cycle-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Nome do Ciclo
              </label>
              <input
                id="cycle-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Balanço Mensal — Bebidas (Set/2026)"
                required
                autoFocus
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Será visível para os operadores durante a contagem.
              </p>
            </div>

            <div>
              <label htmlFor="cycle-armazem" className="block text-sm font-medium text-slate-700 mb-1.5">
                Armazém
              </label>
              <select
                id="cycle-armazem"
                value={armazemId}
                onChange={(e) => setArmazemId(e.target.value)}
                required
                disabled={isLoadingArmazens}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
              >
                <option value="">
                  {isLoadingArmazens ? 'A carregar armazéns...' : 'Selecione um armazém'}
                </option>
                {armazens.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.etiqueta}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-400">
                Toda mercadoria já atribuída a uma prateleira deste armazém entra no ciclo
                como pendente.
              </p>
            </div>

            {armazemId && (
              <div
                className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs ${
                  totalLocalizacoes > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}
              >
                <span>
                  {totalLocalizacoes > 0
                    ? `${totalLocalizacoes} localização(ões) cadastrada(s). Confirme que há mercadoria atribuída a elas na ficha de cada posição em Stock.`
                    : 'Este armazém ainda não tem localizações (prateleiras) cadastradas.'}
                </span>
                <button
                  type="button"
                  onClick={() => setGerirLocalizacoesAberto(true)}
                  className="flex shrink-0 items-center gap-1 rounded-md bg-white/70 px-2 py-1 font-medium hover:bg-white"
                >
                  <MapPin className="h-3 w-3" />
                  Gerir localizações
                </button>
              </div>
            )}

            {error && (
              <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">
                {(error as any)?.response?.data?.message ?? 'Erro ao criar ciclo. Tente novamente.'}
              </p>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || !armazemId || isPending}>
              {isPending ? 'A criar...' : 'Criar Ciclo'}
            </Button>
          </div>
        </form>
      </div>

      {gerirLocalizacoesAberto && armazemId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-bold text-slate-800">Localizações — {armazemSelecionado?.etiqueta}</h3>
              <button
                onClick={() => setGerirLocalizacoesAberto(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <LocalizacoesPanel armazemId={armazemId} armazemNome={armazemSelecionado?.etiqueta ?? ''} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
