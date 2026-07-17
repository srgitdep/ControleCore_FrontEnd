import { useState } from 'react';
import { useStockMutations } from '@/features/stock';

interface MovementModalsProps {
  stockId: string | null;
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUST_PLUS' | 'ADJUST_MINUS' | null;
  onClose: () => void;
}

export function MovementModals({ stockId, type, onClose }: MovementModalsProps) {
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [destinationStockId, setDestinationStockId] = useState('');

  const mutations = useStockMutations();

  if (!stockId || !type) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = Number(quantity);
    if (!q || q <= 0) return;

    if (type === 'IN' || type === 'OUT') {
      mutations.createMovement.mutate(
        { stockId, type, quantity: q, reason },
        { onSuccess: onClose }
      );
    } else if (type === 'TRANSFER') {
      if (!destinationStockId) return;
      mutations.createTransfer.mutate(
        { sourceStockId: stockId, destinationStockId, quantity: q, reason },
        { onSuccess: onClose }
      );
    } else if (type === 'ADJUST_PLUS') {
      mutations.createPositiveAdjustment.mutate(
        { stockId, quantity: q, reason },
        { onSuccess: onClose }
      );
    } else if (type === 'ADJUST_MINUS') {
      mutations.createNegativeAdjustment.mutate(
        { stockId, quantity: q, reason },
        { onSuccess: onClose }
      );
    }
  };

  const isPending = 
    mutations.createMovement.isPending || 
    mutations.createTransfer.isPending || 
    mutations.createPositiveAdjustment.isPending || 
    mutations.createNegativeAdjustment.isPending;

  const getTitle = () => {
    switch(type) {
      case 'IN': return 'Entrada de Mercadoria';
      case 'OUT': return 'SaÃ­da de Mercadoria';
      case 'TRANSFER': return 'TransferÃªncia de ArmazÃ©m';
      case 'ADJUST_PLUS': return 'Ajuste Positivo (Sobra)';
      case 'ADJUST_MINUS': return 'Ajuste Negativo (Quebra/Furto)';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-lg text-gray-800">{getTitle()}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">âœ•</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {type === 'TRANSFER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID do Stock Destino *</label>
              <input
                type="text"
                required
                value={destinationStockId}
                onChange={e => setDestinationStockId(e.target.value)}
                placeholder="Ex: UUID-do-stock"
                className="w-full border-gray-300 rounded-lg p-2 border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade *</label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={e => setQuantity(e.target.value ? Number(e.target.value) : '')}
              className="w-full border-gray-300 rounded-lg p-2 border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo {type.includes('ADJUST') ? '*' : '(Opcional)'}
            </label>
            <textarea
              required={type.includes('ADJUST')}
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Descreva o motivo deste movimento..."
              className="w-full border-gray-300 rounded-lg p-2 border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isPending ? 'A Processar...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
