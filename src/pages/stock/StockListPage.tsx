import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  type ColumnDef,
  type VisibilityState,
} from '@tanstack/react-table';
import { Package, ArrowRightLeft, Plus, Minus, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStockList } from '@/hooks/useStock';
import { useSocket } from '@/hooks/useSocket';
import { ResponsiveTable } from '@/components/common/ResponsiveTable';
import { Button } from '@/components/common/Button';
import { MovementModals } from './components/MovementModals';
import type { Stock } from '@/types/stock.types';

// ─── Column helper tipado ──────────────────────────────────────────────────────
const columnHelper = createColumnHelper<Stock>();

// ─── Modal state type ─────────────────────────────────────────────────────────
type ModalType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUST_PLUS' | 'ADJUST_MINUS' | null;

interface ModalState {
  isOpen: boolean;
  stockId: string | null;
  type: ModalType;
}

export function StockListPage() {
  // Conecta ao WebSockets para realtime updates na lista
  useSocket();

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

  // ─── Definição de colunas ──────────────────────────────────────────────────
  // useMemo evita recriação do array em cada render (requisito TanStack Table)
  const columns = useMemo<ColumnDef<Stock, any>[]>(
    () => [
      columnHelper.accessor('product', {
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
                  Cód: {stock.product?.codigoBarras ?? 'N/A'}
                </p>
              </div>
            </div>
          );
        },
      }),

      columnHelper.accessor('currentQuantity', {
        id: 'balanco',
        header: 'Balanço Atual',
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

      // Esta coluna fica oculta por default em mobile (veja columnVisibility abaixo)
      columnHelper.accessor('minQuantity', {
        id: 'minimo',
        header: 'Mínimo',
        cell: ({ getValue }) => (
          <span className="text-slate-500 text-sm">{getValue()}</span>
        ),
      }),

      columnHelper.display({
        id: 'acoes',
        header: 'Ações',
        cell: ({ row }) => {
          const { id } = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              {/* Histórico (Ledger) */}
              <Link
                to={`/stock/${id}`}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Ver Ledger / Histórico"
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

              {/* Mais ações: Transferir / Ajustar */}
              <div className="relative group inline-block">
                <Button variant="ghost" size="icon" title="Mais opções">
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 shadow-xl rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => openModal(id, 'TRANSFER')}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Transferir para Armazém
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

  // ─── Visibilidade de colunas por breakpoint ────────────────────────────────
  // A coluna "minimo" é irrelevante no card mobile — economiza espaço visual
  const columnVisibility: VisibilityState = {
    minimo: window.innerWidth >= 640, // sm breakpoint
  };

  // ─── Instância TanStack Table ─────────────────────────────────────────────
  const table = useReactTable({
    data: stocks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility },
    // Desativa sort server-side aqui; pode ser activado por coluna se necessário
    manualPagination: true,
    pageCount: totalPages,
  });

  // ─── getRowStatus: linha vermelha se stock crítico ────────────────────────
  const getRowStatus = (stock: Stock): 'default' | 'critical' | 'warning' => {
    if (stock.currentQuantity <= stock.minQuantity) return 'critical';
    if (stock.currentQuantity <= stock.minQuantity * 1.5) return 'warning';
    return 'default';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ─── Cabeçalho da Página ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            Gestão de Inventário (Ledger)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Controle de entradas, saídas e balanços de stock em tempo real.
          </p>
        </div>
      </div>

      {/* ─── Tabela / Cards ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <ResponsiveTable
          table={table}
          isLoading={isLoading}
          emptyMessage="Nenhum stock encontrado."
          getRowStatus={getRowStatus}
        />

        {/* ─── Paginação ─────────────────────────────────────────────────── */}
        {!isLoading && stocks.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Página {page} de {totalPages}
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
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modal de Movimentos ─────────────────────────────────────────── */}
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
