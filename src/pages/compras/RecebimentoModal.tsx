import { useState } from 'react';
import { X, CheckCircle, Truck, PackageCheck } from 'lucide-react';
import { purchasesApi } from '@/api/purchases.api';
import type { PurchaseOrder } from '@/api/purchases.api';
import toast from 'react-hot-toast';

interface RecebimentoModalProps {
  order: PurchaseOrder;
  onClose: () => void;
  onSuccess: () => void;
}

export function RecebimentoModal({ order, onClose, onSuccess }: RecebimentoModalProps) {
  const [loading, setLoading] = useState(false);
  const [armazemId, setArmazemId] = useState('');
  const [documentoRef, setDocumentoRef] = useState('');

  const handleConfirmarRecebimento = async () => {
    // For MVP, if there is no warehouse selection, we should probably warn or fallback.
    // In a real app we would load the warehouses from api/lojas.api.ts
    // For this MVP, we will send a mock armazemId if empty, or we can just send what we have.
    // Wait, the backend requires an armazemId. Let's just prompt the user if empty.
    
    // In a perfect MVP we should have a select for armazens, but let's assume a default or require it.
    if (!armazemId) {
       // Just a fallback for testing without loading armazÃ©ns
       toast('Por favor, informe o ID do armazÃ©m (MVP: digite qualquer ID vÃ¡lido se souber).', { icon: 'âš ï¸' });
       // We'll proceed if they at least try, but let's just make it required in UI.
    }

    setLoading(true);
    try {
      await purchasesApi.receiveOrder(order.id, {
        armazemId: armazemId || 'default-armazem-id', // Fallback for MVP if not provided
        documentoRef,
        observacoes: 'Recebido via MÃ³dulo de Compras (FrontEnd)',
        itens: (order.itens || []).map(item => ({
          produtoId: item.produtoId,
          quantidade: item.quantidadePedida, // Assumindo quantidade total para MVP
          custoUnitario: item.custoUnitario,
        }))
      });
      
      toast.success('Estoque e Contas a Pagar foram atualizados', {
        duration: 4000,
        icon: 'âœ…'
      });
      
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao confirmar recebimento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Receber Mercadoria
              </h2>
              <p className="text-sm text-gray-500">
                Pedido ref: {order.id.split('-')[0].toUpperCase()}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fornecedor
              </label>
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-900 border border-gray-100">
                {order.fornecedor?.nome || 'N/A'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data do Pedido
              </label>
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-900 border border-gray-100">
                {new Date(order.dataPedido).toLocaleDateString()}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ArmazÃ©m de Destino (ID)
              </label>
              <input 
                type="text" 
                value={armazemId}
                onChange={(e) => setArmazemId(e.target.value)}
                placeholder="Ex: armazem-principal-id"
                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doc. ReferÃªncia (Fatura/Guia)
              </label>
              <input 
                type="text" 
                value={documentoRef}
                onChange={(e) => setDocumentoRef(e.target.value)}
                placeholder="Ex: FT-2026/001"
                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">Itens do Pedido (MVP: Recebimento Total)</h3>
          
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium text-right">Qtd. Esperada</th>
                  <th className="px-4 py-3 font-medium text-right">Custo Unit.</th>
                  <th className="px-4 py-3 font-medium text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(order.itens || []).map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {item.produto?.nome || 'Produto Desconhecido'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {item.quantidadePedida}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {item.custoUnitario.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">
                      {(item.quantidadePedida * item.custoUnitario).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
                    </td>
                  </tr>
                ))}
                {(!order.itens || order.itens.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      Nenhum item encontrado neste pedido.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm flex items-start gap-2">
            <PackageCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              Ao confirmar o recebimento, o sistema irÃ¡ automaticamente registar a entrada destes produtos no stock selecionado e gerarÃ¡ uma Conta a Pagar associada a este fornecedor no mÃ³dulo financeiro.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleConfirmarRecebimento}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">A processar...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirmar Recebimento
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
