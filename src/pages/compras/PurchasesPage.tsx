import { useState, useEffect } from 'react';
import { ShoppingBag, Package, ArrowRight } from 'lucide-react';
import { purchasesApi, EstadoPedidoCompra } from '@/api/purchases.api';
import type { PurchaseOrder } from '@/api/purchases.api';
import { suppliersApi } from '@/api/suppliers.api';
import type { Supplier } from '@/api/suppliers.api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { RecebimentoModal } from './RecebimentoModal';

export function PurchasesPage() {
  const [activeTab, setActiveTab] = useState<'PEDIDOS' | 'FORNECEDORES'>('PEDIDOS');
  
  // Data States
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'PEDIDOS') {
        const data = await purchasesApi.getOrders();
        setOrders(data);
      } else {
        const data = await suppliersApi.getSuppliers();
        setSuppliers(data);
      }
    } catch (err) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestPurchases = async () => {
    toast.loading('Gerando sugestão de compras...', { id: 'sugestao' });
    try {
      // Simplification for MVP: get all products, filter if stock < min
      // Wait, we don't have stock data easily available in getProducts here.
      // But we can just show a toast for the MVP.
      toast.success('Sugestão gerada. (Simulação MVP)', { id: 'sugestao' });
    } catch (error) {
      toast.error('Erro ao gerar sugestão', { id: 'sugestao' });
    }
  };

  const getStatusBadge = (status: EstadoPedidoCompra) => {
    switch (status) {
      case EstadoPedidoCompra.RASCUNHO:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Rascunho</span>;
      case EstadoPedidoCompra.ENVIADO:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Enviado</span>;
      case EstadoPedidoCompra.RECEBIDO:
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Recebido</span>;
      case EstadoPedidoCompra.CANCELADO:
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Cancelado</span>;
      default:
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const handleOrderClick = (order: PurchaseOrder) => {
    if (order.estado === EstadoPedidoCompra.ENVIADO || order.estado === EstadoPedidoCompra.PARCIAL) {
      setSelectedOrder(order);
    } else {
      toast('Este pedido está ' + order.estado, { icon: 'ℹ️' });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Módulo de Compras</h1>
          <p className="text-gray-500">Gestão de fornecedores e pedidos de compra</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSuggestPurchases}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Sugestão de Compras
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Novo Pedido
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('PEDIDOS')}
          className={cn(
            "pb-4 px-2 font-medium text-sm transition-colors relative",
            activeTab === 'PEDIDOS' ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
          )}
        >
          Pedidos de Compra
          {activeTab === 'PEDIDOS' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('FORNECEDORES')}
          className={cn(
            "pb-4 px-2 font-medium text-sm transition-colors relative",
            activeTab === 'FORNECEDORES' ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
          )}
        >
          Fornecedores
          {activeTab === 'FORNECEDORES' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : activeTab === 'PEDIDOS' ? (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">Data</th>
                <th className="px-6 py-4 font-medium">Fornecedor</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium">Responsável</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Nenhum pedido de compra encontrado.
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(order.dataPedido).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {order.fornecedor?.nome || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.estado)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.criadoPor?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {order.estado === EstadoPedidoCompra.ENVIADO ? (
                        <button 
                          onClick={() => handleOrderClick(order)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center justify-end gap-1"
                        >
                          Receber <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleOrderClick(order)}
                          className="text-gray-400 hover:text-gray-600 text-sm font-medium"
                        >
                          Detalhes
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">NUIT</th>
                <th className="px-6 py-4 font-medium">Contacto</th>
                <th className="px-6 py-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Nenhum fornecedor encontrado.
                  </td>
                </tr>
              ) : (
                suppliers.map(supplier => (
                  <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{supplier.nome}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{supplier.nuit || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {supplier.email && <div>{supplier.email}</div>}
                      {supplier.telefone && <div>{supplier.telefone}</div>}
                    </td>
                    <td className="px-6 py-4">
                      {supplier.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Ativo</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Inativo</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedOrder && (
        <RecebimentoModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onSuccess={() => {
            setSelectedOrder(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
