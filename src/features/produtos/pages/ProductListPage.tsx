import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { useProducts, useDeleteProduct } from '@/features/produtos';
import { useAuth } from '@/features/auth';
import type { Product } from '@/features/produtos';
import { Button } from '@/components/common/Button';
import { ResponsiveTable } from '@/components/common/ResponsiveTable';
import type { ColumnDef, VisibilityState } from '@tanstack/react-table';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { ProductFormModal } from '../components/ProductFormModal';
import { usePermissions } from '@/hooks/usePermissions';

const columnHelper = createColumnHelper<Product>();

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function ProductListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  
  const [modalState, setModalState] = useState<{ isOpen: boolean; productToEdit?: Product }>({
    isOpen: false,
  });

  const { user } = useAuth();
  const { permissions } = usePermissions();
  
  // VerificaÃ§Ã£o robusta de permissÃµes (suporta vÃ¡rios formatos vindos do Backend e Roles diretas)
  const canManage = 
    user?.role === 'SUPER_ADMIN' || 
    user?.role === 'ADMIN' || 
    user?.role === 'MANAGER' || 
    (Array.isArray(permissions) && permissions.some(p => 
      p === 'GERIR_CATALOGO' || 
      p === 'manage:catalog' || 
      p === 'manage:produto' || 
      p === 'manage:all' ||
      p.includes('GERIR_CATALOGO')
    ));

  const { data, isLoading } = useProducts({
    search: debouncedSearch,
    page,
    limit,
  });

  const deleteProductMutation = useDeleteProduct();

  const products = data?.data || [];
  const totalPages = data?.total ? Math.ceil(data.total / limit) : 1;

  const handleEdit = (product: Product) => {
    setModalState({ isOpen: true, productToEdit: product });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja eliminar este produto?')) {
      deleteProductMutation.mutate(id);
    }
  };

  const columns = useMemo<ColumnDef<Product, any>[]>(
    () => [
      columnHelper.accessor('nome', {
        header: 'Produto',
        cell: (info) => {
          const product = info.row.original;
          return (
            <div>
              <div className="font-medium text-slate-900">{product.nome}</div>
              {product.codigoBarras && (
                <div className="text-xs text-slate-500 font-mono mt-0.5">EAN: {product.codigoBarras}</div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('categoria.nome', {
        header: 'Categoria',
        cell: (info) => info.getValue() || <span className="text-slate-400">Sem categoria</span>,
      }),
      columnHelper.accessor('precoCusto', {
        header: 'PreÃ§o de Custo',
        cell: (info) => (
          <div className="text-slate-700">
            {(info.getValue() || 0).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
          </div>
        ),
      }),
      columnHelper.accessor('precoVenda', {
        header: 'PreÃ§o de Venda',
        cell: (info) => (
          <div className="font-semibold text-slate-900">
            {(info.getValue() || 0).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
          </div>
        ),
      }),
      columnHelper.accessor('margemLucro', {
        header: 'Margem',
        cell: (info) => {
          const margem = info.getValue() || 0;
          let badgeColor = 'bg-slate-100 text-slate-700';
          if (margem < 15) {
            badgeColor = 'bg-rose-100 text-rose-700';
          } else if (margem > 30) {
            badgeColor = 'bg-emerald-100 text-emerald-700';
          }
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
              {margem.toFixed(2)}%
            </span>
          );
        },
      }),
      columnHelper.accessor('unidadeMedida', {
        header: 'Unidade',
        cell: (info) => {
          const um = info.getValue() || 'UN';
          const isWeighable = info.row.original.isWeighable;
          return (
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">{um}</span>
              {isWeighable && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-medium" title="Produto PesÃ¡vel na BalanÃ§a">
                  BalanÃ§a
                </span>
              )}
            </div>
          );
        },
      }),
      canManage && columnHelper.display({
        id: 'actions',
        header: 'AÃ§Ãµes',
        cell: (info) => {
          const product = info.row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleEdit(product)}
                title="Editar Produto"
                className="h-8 w-8"
              >
                <Edit className="h-4 w-4 text-slate-600" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDelete(product.id)}
                title="Eliminar Produto"
                className="h-8 w-8 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      }),
    ].filter(Boolean) as ColumnDef<Product, any>[],
    [canManage]
  );

  const columnVisibility: VisibilityState = {
    categoria: window.innerWidth >= 640,
    precoCusto: window.innerWidth >= 768,
    unidadeMedida: window.innerWidth >= 1024,
  };

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility },
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-indigo-600" />
            CatÃ¡logo de Produtos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            FaÃ§a a gestÃ£o dos produtos, preÃ§os e configuraÃ§Ãµes de balanÃ§a.
          </p>
        </div>

        {canManage && (
          <Button
            onClick={() => setModalState({ isOpen: true, productToEdit: undefined })}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome, SKU ou CÃ³digo de Barras..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 w-full bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <ResponsiveTable
          table={table}
          isLoading={isLoading}
          emptyMessage={debouncedSearch ? "Nenhum produto encontrado para sua pesquisa." : "Ainda nÃ£o existem produtos registados."}
        />

        {!isLoading && products.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm bg-white">
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
        <ProductFormModal
          productToEdit={modalState.productToEdit}
          onClose={() => setModalState({ isOpen: false })}
        />
      )}
    </div>
  );
}
