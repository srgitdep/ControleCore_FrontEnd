import { useState } from 'react';
import { X, ClipboardList, MapPin } from 'lucide-react';
import { useCreateCycle, useLocalizacoesInventario } from '@/features/stock';
import { useArmazens } from '@/features/lojas';
import { Button } from '@/shared/ui';
import { GerirLocalizacoesModal } from './inventario/GerirLocalizacoesModal';

interface CreateCycleModalProps {
  onClose: () => void;
  onCreated?: (cycleId: string) => void;
}

/**
 * Novo ciclo de inventário (§5): ao criar, o backend carrega automaticamente
 * o perímetro — todo produto associado a uma localização (prateleira) deste
 * armazém entra no ciclo como PENDENTE. Por isso o armazém é obrigatório: sem
 * ele não há perímetro a carregar.
 */
export function CreateCycleModal({ onClose, onCreated }: CreateCycleModalProps) {
  const [name, setName] = useState('');
  const [armazemId, setArmazemId] = useState('');
  const [gerirLocalizacoesAberto, setGerirLocalizacoesAberto] = useState(false);
  const { armazens, isLoading: isLoadingArmazens } = useArmazens();
  const { mutate: createCycle, isPending, error } = useCreateCycle();
  const { data: localizacoes = [] } = useLocalizacoesInventario(armazemId || null);

  const armazemSelecionado = armazens.find((a) => a.id === armazemId);
  const totalProdutosNoPerimetro = localizacoes.reduce((soma, l) => soma + l._count.produtos, 0);

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
                Todos os produtos associados a uma localização (prateleira) deste armazém
                entram no ciclo como pendentes.
              </p>
            </div>

            {armazemId && (
              <div
                className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs ${
                  totalProdutosNoPerimetro > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}
              >
                <span>
                  {totalProdutosNoPerimetro > 0
                    ? `${totalProdutosNoPerimetro} produto(s) em ${localizacoes.length} localização(ões).`
                    : 'Este armazém ainda não tem localizações com produtos associados.'}
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
            <Button
              type="submit"
              disabled={!name.trim() || !armazemId || totalProdutosNoPerimetro === 0 || isPending}
            >
              {isPending ? 'A criar...' : 'Criar Ciclo'}
            </Button>
          </div>
        </form>
      </div>

      {gerirLocalizacoesAberto && armazemId && (
        <GerirLocalizacoesModal
          armazemId={armazemId}
          armazemNome={armazemSelecionado?.etiqueta ?? ''}
          onClose={() => setGerirLocalizacoesAberto(false)}
        />
      )}
    </div>
  );
}
