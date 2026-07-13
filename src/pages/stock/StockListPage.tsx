import { useState } from 'react';
import { useStockList } from '@/hooks/useStock';
import { useSocket } from '@/hooks/useSocket';
import { MovementModals } from './components/MovementModals';
import { Package, ArrowRightLeft, Plus, Minus, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export function StockListPage() {
  // Conecta ao WebSockets para realtime updates na lista
  useSocket();
  
  const [page, setPage] = useState(1);
  const { data, isLoading } = useStockList({ page, limit: 10 });

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    stockId: string | null;
    type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUST_PLUS' | 'ADJUST_MINUS' | null;
  }>({
    isOpen: false,
    stockId: null,
    type: null
  });

  const stocks = data?.data || [];
  const totalPages = data?.lastPage || 1;

  const openModal = (stockId: string, type: typeof modalState.type) => {
    setModalState({ isOpen: true, stockId, type });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, stockId: null, type: null });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            Gestão de Inventário (Ledger)
          </h1>
          <p className="text-gray-500 text-sm mt-1">Controle de entradas, saídas e balanços de stock em tempo real.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                <th className="p-4 font-semibold">Produto</th>
                <th className="p-4 font-semibold text-center">Balanço Atual</th>
                <th className="p-4 font-semibold text-center">Mínimo</th>
                <th className="p-4 font-semibold text-right">Ações (Movimentos)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    A carregar stock...
                  </td>
                </tr>
              ) : stocks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">Nenhum stock encontrado.</td>
                </tr>
              ) : (
                stocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {stock.product?.imagemUrl ? (
                          <img src={stock.product.imagemUrl} alt={stock.product.nome} className="w-10 h-10 rounded bg-gray-100 object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{stock.product?.nome || 'Produto Desconhecido'}</p>
                          <p className="text-xs text-gray-500">Cód: {stock.product?.codigoBarras || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                        stock.currentQuantity <= stock.minQuantity 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {stock.currentQuantity} <span className="ml-1 text-xs opacity-75">{stock.product?.unidadeMedida || 'UN'}</span>
                      </span>
                    </td>
                    <td className="p-4 text-center text-gray-500 text-sm">
                      {stock.minQuantity}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botão de Histórico (Ledger) */}
                        <Link 
                          to={`/stock/${stock.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver Ledger / Histórico"
                        >
                          <FileText className="h-4 w-4" />
                        </Link>
                        
                        <div className="w-px h-6 bg-gray-200 mx-1"></div>

                        {/* Movimentos Básicos */}
                        <button 
                          onClick={() => openModal(stock.id, 'IN')}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                        >
                          <Plus className="h-3 w-3" /> IN
                        </button>
                        <button 
                          onClick={() => openModal(stock.id, 'OUT')}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg transition-colors"
                        >
                          <Minus className="h-3 w-3" /> OUT
                        </button>
                        
                        {/* Transferências e Ajustes */}
                        <div className="relative group inline-block">
                          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <ArrowRightLeft className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button 
                              onClick={() => openModal(stock.id, 'TRANSFER')}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                            >
                              Transferir para Armazém
                            </button>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <button 
                              onClick={() => openModal(stock.id, 'ADJUST_PLUS')}
                              className="w-full text-left px-3 py-2 text-sm text-green-700 hover:bg-green-50 rounded-lg"
                            >
                              Ajuste + (Sobra)
                            </button>
                            <button 
                              onClick={() => openModal(stock.id, 'ADJUST_MINUS')}
                              className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg"
                            >
                              Ajuste - (Quebra)
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm">
          <span className="text-gray-500">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border border-gray-200 rounded-md text-gray-600 disabled:opacity-50 hover:bg-gray-50"
            >
              Anterior
            </button>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border border-gray-200 rounded-md text-gray-600 disabled:opacity-50 hover:bg-gray-50"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>

      {modalState.isOpen && (
        <MovementModals 
          stockId={modalState.stockId} 
          type={modalState.type} 
          onClose={closeModal} 
        />
      )}
    </div>
  );
}
