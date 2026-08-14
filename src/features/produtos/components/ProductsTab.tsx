import { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
// Importado do módulo directo, e não do barrel `@/features/produtos`: o barrel passa a
// exportar este componente, e importar dele aqui fecharia um ciclo.
import { useProducts, useDeleteProduct } from '../hooks/useCatalog';
import type { Product } from '../types';
import { useAuth, usePermissions } from '@/features/auth';
import { Button, ResponsiveTable, ConfirmDialog } from '@/shared/ui';
import { useDebounce } from '@/shared/hooks';
import type { ColumnDef, VisibilityState } from '@tanstack/react-table';
import { getCoreRowModel, useReactTable, createColumnHelper } from '@tanstack/react-table';
import { ProductFormModal } from './ProductFormModal';

/**
 * O catálogo de produtos, sem cabeçalho de página.
 *
 * Extraído da `ProductListPage` para poder viver dentro do separador «Catálogo» da
 * secção Stock: a página trazia o seu próprio `<h1>` e `p-6 max-w-7xl mx-auto`, que
 * dentro de outra página davam dois títulos e padding a dobrar.
 *
 * Produtos e Stock são a mesma matéria vista de dois ângulos — o que se vende e o que
 * existe. Tê-los como duas entradas de menu obrigava a saltar entre secções para
 * responder a uma pergunta só.
 */
export function ProductsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  // `useDebounce` devolve o valor, não um par — ver a nota em `CriarPedidoModal`. Com
  // destructuring, a pesquisa filtrava pelo primeiro carácter escrito.
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  const [modalState, setModalState] = useState<{ isOpen: boolean; productToEdit?: Product }>({
    isOpen: false,
  });

  // O `confirm()` nativo do browser bloqueia a janela e não se estiliza; o projecto já
  // tem um `ConfirmDialog`, e apagar um produto merece o mesmo cuidado que as outras
  // eliminações da aplicação.
  const [aEliminar, setAEliminar] = useState<Product | null>(null);

  const { user } = useAuth();
  const { permissions } = usePermissions();

  const canManage =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN' ||
    user?.role === 'MANAGER' ||
    (Array.isArray(permissions) &&
      permissions.some(
        (p) =>
          p === 'GERIR_CATALOGO' ||
          p === 'manage:catalog' ||
          p === 'manage:produto' ||
          p === 'manage:all' ||
          p.includes('GERIR_CATALOGO'),
      ));

  const { data, isLoading } = useProducts({ search: debouncedSearch, page, limit });
  const deleteProductMutation = useDeleteProduct();

  const products = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const columns = useMemo<ColumnDef<Product, any>[]>(() => {
    const columnHelper = createColumnHelper<Product>();

    return [
      columnHelper.accessor('nome', {
        header: 'Produto',
        cell: (info) => {
          const product = info.row.original;
          return (
            <div>
              <div className="font-medium text-slate-900">{product.nome}</div>
              {product.codigoBarras && (
                <div className="mt-0.5 font-mono text-xs text-slate-500">
                  EAN: {product.codigoBarras}
                </div>
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
        header: 'Preço de Custo',
        cell: (info) => (
          <div className="text-slate-700">
            {(info.getValue() || 0).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
          </div>
        ),
      }),
      columnHelper.accessor('precoVenda', {
        header: 'Preço de Venda',
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
          const cor =
            margem < 15
              ? 'bg-rose-100 text-rose-700'
              : margem > 30
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-700';

          return (
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${cor}`}>
              {margem.toFixed(2)}%
            </span>
          );
        },
      }),
      columnHelper.accessor('unidadeMedida', {
        header: 'Unidade',
        cell: (info) => (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">{info.getValue() || 'UN'}</span>
            {info.row.original.isWeighable && (
              <span
                className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800"
                title="Produto pesável na balança"
              >
                Balança
              </span>
            )}
          </div>
        ),
      }),
      canManage &&
        columnHelper.display({
          id: 'actions',
          header: 'Ações',
          cell: (info) => {
            const product = info.row.original;
            return (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setModalState({ isOpen: true, productToEdit: product })}
                  title="Editar produto"
                  className="h-8 w-8"
                >
                  <Edit className="h-4 w-4 text-slate-600" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAEliminar(product)}
                  title="Eliminar produto"
                  className="h-8 w-8 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          },
        }),
    ].filter(Boolean) as ColumnDef<Product, any>[];
  }, [canManage]);

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
    <div className="space-y-4">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome, SKU ou código de barras..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 pl-9 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {canManage && (
          <Button
            onClick={() => setModalState({ isOpen: true, productToEdit: undefined })}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <ResponsiveTable
          table={table}
          isLoading={isLoading}
          emptyMessage={
            debouncedSearch
              ? 'Nenhum produto encontrado para a sua pesquisa.'
              : 'Ainda não existem produtos registados.'
          }
        />

        {!isLoading && products.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3 text-sm">
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
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
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

      <ConfirmDialog
        isOpen={aEliminar !== null}
        title="Eliminar produto"
        message={
          aEliminar
            ? `Eliminar "${aEliminar.nome}"? Se o produto tiver stock, vendas ou compras associadas, a eliminação será recusada — nesse caso desactive-o em vez de o apagar.`
            : ''
        }
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteProductMutation.isPending}
        onConfirm={() => {
          if (!aEliminar) return;
          deleteProductMutation.mutate(aEliminar.id, { onSettled: () => setAEliminar(null) });
        }}
        onCancel={() => setAEliminar(null)}
      />
    </div>
  );
}
