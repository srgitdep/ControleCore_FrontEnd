import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  type ColumnDef,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  Package,
  ArrowRightLeft,
  Plus,
  Minus,
  FileText,
  BarChart3,
  ClipboardList,
  Clock,
  ArrowUp,
  ArrowDown,
  Settings2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useStockList, useAllMovements } from '@/features/stock';
import { useSocket } from '@/hooks/useSocket';
import { ResponsiveTable } from '@/components/common/ResponsiveTable';
import { Button } from '@/components/common/Button';
import { MovementModals } from '../components/MovementModals';
import { InventoryTab } from '../components/InventoryTab';
import type { Stock, StockMovement } from '@/features/stock';

// â”€â”€â”€ Tab definition â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type StockTab = 'estoque' | 'movimentos' | 'inventario';

const TABS: { id: StockTab; label: string; icon: React.ElementType }[] = [
  { id: 'estoque', label: 'Estoque Atual', icon: Package },
  { id: 'movimentos', label: 'Movimentos', icon: BarChart3 },
  { id: 'inventario', label: 'BalanÃ§o / InventÃ¡rio', icon: ClipboardList },
];

// â”€â”€â”€ Column helper tipado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const stockColumnHelper = createColumnHelper<Stock>();
const movementColumnHelper = createColumnHelper<StockMovement>();

// â”€â”€â”€ Modal state type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type ModalType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUST_PLUS' | 'ADJUST_MINUS' | null;

interface ModalState {
  isOpen: boolean;
  stockId: string | null;
  type: ModalType;
}

// â”€â”€â”€ Aba: Estoque Atual â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StockCurrentTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useStockList({ page, limit: 10 });

  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    stockId: null,
    type: null,
  });

  const stocks = data?.data ?? [];
  const totalPages = data?.lastPage ?? 1;

  const openModal = (stockId: string, type: ModalType) =>
    setModalState({ isOpen: true, stockId, type });

  const closeModal = () =>
    setModalState({ isOpen: false, stockId: null, type: null });

  const columns = useMemo<ColumnDef<Stock, any>[]>(
    () => [
      stockColumnHelper.accessor('product', {
        id: 'produto',
        header: 'Produto',
        cell: ({ row }) => {
          const stock = row.original;
          return (
            <div className="flex items-center gap-3">
              {stock.product?.imagemUrl ? (
                <img
                  src={stock.product.imagemUrl}
                  alt={stock.product.nome}
                  className="w-10 h-10 rounded-lg bg-slate-100 object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-slate-400" />
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-900">
                  {stock.product?.nome ?? 'Produto Desconhecido'}
                </p>
                <p className="text-xs text-slate-500">
                  CÃ³d: {stock.product?.codigoBarras ?? 'N/A'}
                </p>
              </div>
            </div>
          );
        },
      }),

      stockColumnHelper.accessor('currentQuantity', {
        id: 'balanco',
        header: 'BalanÃ§o Atual',
        cell: ({ row }) => {
          const { currentQuantity, minQuantity, product } = row.original;
          const isCritical = currentQuantity <= minQuantity;
          return (
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                isCritical ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}
            >
              {currentQuantity}
              <span className="ml-1 text-xs opacity-75">
                {product?.unidadeMedida ?? 'UN'}
              </span>
            </span>
          );
        },
      }),

      stockColumnHelper.accessor('minQuantity', {
        id: 'minimo',
        header: 'MÃ­nimo',
        cell: ({ getValue }) => (
          <span className="text-slate-500 text-sm">{getValue()}</span>
        ),
      }),

      stockColumnHelper.display({
        id: 'acoes',
        header: 'AÃ§Ãµes',
        cell: ({ row }) => {
          const { id } = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Link
                to={`/stock/${id}`}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Ver Ledger / HistÃ³rico"
              >
                <FileText className="h-4 w-4" />
              </Link>

              <div className="w-px h-6 bg-slate-200 mx-1" />

              <Button
                variant="success"
                size="sm"
                onClick={() => openModal(id, 'IN')}
                className="gap-1"
              >
                <Plus className="h-3 w-3" /> IN
              </Button>

              <Button
                variant="warning"
                size="sm"
                onClick={() => openModal(id, 'OUT')}
                className="gap-1"
              >
                <Minus className="h-3 w-3" /> OUT
              </Button>

              <div className="relative group inline-block">
                <Button variant="ghost" size="icon" title="Mais opÃ§Ãµes">
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 shadow-xl rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => openModal(id, 'TRANSFER')}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Transferir para ArmazÃ©m
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  <button
                    onClick={() => openModal(id, 'ADJUST_PLUS')}
                    className="w-full text-left px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 rounded-lg"
                  >
                    Ajuste + (Sobra)
                  </button>
                  <button
                    onClick={() => openModal(id, 'ADJUST_MINUS')}
                    className="w-full text-left px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 rounded-lg"
                  >
                    Ajuste - (Quebra)
                  </button>
                </div>
              </div>
            </div>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const columnVisibility: VisibilityState = {
    minimo: window.innerWidth >= 640,
  };

  const table = useReactTable({
    data: stocks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility },
    manualPagination: true,
    pageCount: totalPages,
  });

  const getRowStatus = (stock: Stock): 'default' | 'critical' | 'warning' => {
    if (stock.currentQuantity <= stock.minQuantity) return 'critical';
    if (stock.currentQuantity <= stock.minQuantity * 1.5) return 'warning';
    return 'default';
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <ResponsiveTable
          table={table}
          isLoading={isLoading}
          emptyMessage="Nenhum stock encontrado."
          getRowStatus={getRowStatus}
        />

        {!isLoading && stocks.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              PÃ¡gina {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                PrÃ³xima
              </Button>
            </div>
          </div>
        )}
      </div>

      {modalState.isOpen && (
        <MovementModals
          stockId={modalState.stockId}
          type={modalState.type}
          onClose={closeModal}
        />
      )}
    </>
  );
}

// â”€â”€â”€ Aba: Movimentos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MovementsTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAllMovements({ page, limit: 15 });

  const movements = data?.data ?? [];
  const totalPages = data?.lastPage ?? 1;

  const TYPE_STYLES: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    IN: { label: 'Entrada', icon: <ArrowUp className="h-3 w-3" />, cls: 'bg-emerald-100 text-emerald-700' },
    OUT: { label: 'SaÃ­da', icon: <ArrowDown className="h-3 w-3" />, cls: 'bg-rose-100 text-rose-700' },
    ADJUSTMENT: { label: 'Ajuste', icon: <Settings2 className="h-3 w-3" />, cls: 'bg-amber-100 text-amber-700' },
  };

  const columns = useMemo<ColumnDef<StockMovement, any>[]>(
    () => [
      movementColumnHelper.accessor('createdAt', {
        header: 'Data/Hora',
        cell: ({ getValue }) => (
          <span className="text-xs text-slate-500 tabular-nums">
            {new Date(getValue()).toLocaleString('pt-MZ', {
              day: '2-digit', month: '2-digit', year: '2-digit',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        ),
      }),
      movementColumnHelper.accessor('type', {
        header: 'Tipo',
        cell: ({ getValue }) => {
          const type = getValue() as string;
          const config = TYPE_STYLES[type] ?? { label: type, icon: null, cls: 'bg-slate-100 text-slate-600' };
          return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.cls}`}>
              {config.icon}
              {config.label}
            </span>
          );
        },
      }),
      movementColumnHelper.accessor('quantity', {
        header: 'Qtd',
        cell: ({ row }) => {
          const { quantity, type } = row.original;
          const signed = type === 'OUT' ? -quantity : quantity;
          return (
            <span className={`font-bold tabular-nums text-sm ${signed < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {signed > 0 ? '+' : ''}{signed}
            </span>
          );
        },
      }),
      movementColumnHelper.accessor('balanceAfter', {
        header: 'Saldo ApÃ³s',
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-slate-700">{getValue()}</span>
        ),
      }),
      movementColumnHelper.accessor('reason', {
        header: 'Motivo',
        cell: ({ getValue }) => (
          <span className="text-xs text-slate-500 truncate max-w-[200px] block">
            {getValue() ?? 'â€”'}
          </span>
        ),
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const table = useReactTable({
    data: movements,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <Clock className="h-4 w-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-600">HistÃ³rico de Movimentos</span>
      </div>
      <ResponsiveTable
        table={table}
        isLoading={isLoading}
        emptyMessage="Nenhum movimento registado."
      />
      {!isLoading && movements.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="text-slate-500">PÃ¡gina {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>PrÃ³xima</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ PÃ¡gina Principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function StockListPage() {
  useSocket();
  const [activeTab, setActiveTab] = useState<StockTab>('estoque');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* â”€â”€â”€ CabeÃ§alho â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            GestÃ£o de Estoque
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Controle de entradas, saÃ­das, balanÃ§os e inventÃ¡rio fÃ­sico.
          </p>
        </div>
      </div>

      {/* â”€â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Tab Bar */}
        <div className="relative px-4 border-b border-slate-100">
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all duration-150 -mb-px whitespace-nowrap',
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
                  )}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'estoque' && <StockCurrentTab />}
          {activeTab === 'movimentos' && <MovementsTab />}
          {activeTab === 'inventario' && <InventoryTab />}
        </div>
      </div>
    </div>
  );
}
