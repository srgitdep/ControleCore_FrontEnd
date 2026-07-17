import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStockDetails, useStockMovements } from '@/features/stock';
import { useSocket } from '@/hooks/useSocket';
import { ArrowLeft, Package, Clock, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export function StockDetailsPage() {
  const { id } = useParams<{ id: string }>();
  useSocket(); // Realtime

  const [page, setPage] = useState(1);
  const limit = 15;

  const { data: stock, isLoading: loadingStock } = useStockDetails(id!);
  const { data: movementsData, isLoading: loadingMovements } = useStockMovements(id!, { page, limit });

  const movements = movementsData?.data || [];
  const totalPages = movementsData?.lastPage || 1;

  if (loadingStock) {
    return <div className="p-8 text-center text-gray-500">A carregar detalhes do ledger...</div>;
  }

  if (!stock) {
    return <div className="p-8 text-center text-red-500">Stock não encontrado.</div>;
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN':
      case 'TRANSFER_IN':
      case 'ADJUSTMENT_PLUS':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'OUT':
      case 'TRANSFER_OUT':
      case 'ADJUSTMENT_MINUS':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <RefreshCcw className="h-4 w-4 text-blue-600" />;
    }
  };

  const formatMovementType = (type: string) => {
    switch (type) {
      case 'IN': return 'Entrada (Compra/Receção)';
      case 'OUT': return 'SaÍda (Venda/Expedição)';
      case 'TRANSFER_IN': return 'Transferência (Entrada)';
      case 'TRANSFER_OUT': return 'Transferência (SaÍda)';
      case 'ADJUSTMENT_PLUS': return 'Ajuste Positivo';
      case 'ADJUSTMENT_MINUS': return 'Ajuste Negativo';
      default: return type;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto h-[calc(100vh-4rem)] overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => window.history.back()} 
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center shadow-inner overflow-hidden">
              {stock.product?.imagemUrl ? (
                <img src={stock.product.imagemUrl} alt={stock.product.nome} className="w-full h-full object-cover" />
              ) : (
                <Package className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{stock.product?.nome || 'Produto Desconhecido'}</h1>
              <p className="text-gray-500 text-sm">Cód: {stock.product?.codigoBarras || 'N/A'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500 mb-1">Balanço Atual</p>
            <span className={`text-4xl font-black ${stock.currentQuantity <= stock.minQuantity ? 'text-red-600' : 'text-gray-900'}`}>
              {stock.currentQuantity}
            </span>
          </div>
        </div>
      </div>

      {/* Tabela de Movimentos (Ledger) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-400" />
          <h2 className="font-bold text-gray-800">Histórico de Movimentos (Ledger)</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="p-4 font-semibold w-48">Data/Hora</th>
                <th className="p-4 font-semibold">Tipo</th>
                <th className="p-4 font-semibold text-center">Qtd</th>
                <th className="p-4 font-semibold text-center text-blue-600">Balanço Após</th>
                <th className="p-4 font-semibold">Motivo / Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingMovements ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">A carregar ledger...</td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">Sem movimentos registados para este stock.</td>
                </tr>
              ) : (
                movements.map((mov) => {
                  const isPositive = ['IN', 'TRANSFER_IN', 'ADJUSTMENT_PLUS'].includes(mov.type);
                  return (
                    <tr key={mov.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 whitespace-nowrap text-gray-600">
                        {format(new Date(mov.createdAt), "dd MMM yyyy, HH:mm", { locale: pt })}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-full ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
                            {getMovementIcon(mov.type)}
                          </div>
                          <span className="font-medium text-gray-700">{formatMovementType(mov.type)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? '+' : '-'}{mov.quantity}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-md">
                          {mov.balanceAfter}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">
                        <p className="line-clamp-1">{mov.reason || '-'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{mov.user?.nome || 'Sistema'}</p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2 text-sm">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border border-gray-200 rounded-md text-gray-600 disabled:opacity-50 hover:bg-gray-50"
            >
              Anterior
            </button>
            <span className="px-2 text-gray-500 font-medium">{page} / {totalPages}</span>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border border-gray-200 rounded-md text-gray-600 disabled:opacity-50 hover:bg-gray-50"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
