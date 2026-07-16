import { useState } from 'react';
import { X, ClipboardList } from 'lucide-react';
import { useCreateCycle } from '@/hooks/useInventory';
import { Button } from '@/components/common/Button';

interface CreateCycleModalProps {
  onClose: () => void;
}

export function CreateCycleModal({ onClose }: CreateCycleModalProps) {
  const [name, setName] = useState('');
  const { mutate: createCycle, isPending, error } = useCreateCycle();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createCycle({ name: name.trim() }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
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

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label
                htmlFor="cycle-name"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Nome do Ciclo
              </label>
              <input
                id="cycle-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Balanço Mensal — Bebidas (Jul/2026)"
                required
                autoFocus
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Será visível para os operadores durante a contagem.
              </p>
            </div>

            {error && (
              <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">
                {(error as any)?.response?.data?.message ?? 'Erro ao criar ciclo. Tente novamente.'}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending ? 'A criar...' : 'Criar Ciclo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
