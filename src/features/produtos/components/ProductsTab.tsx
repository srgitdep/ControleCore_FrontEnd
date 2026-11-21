import { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Image as ImageIcon, Download, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
// Importado do módulo directo, e não do barrel `@/features/produtos`: o barrel passa a
// exportar este componente, e importar dele aqui fecharia um ciclo.
import { useProducts, useDeleteProduct } from '../hooks/useCatalog';
import { catalogApi } from '../api/catalog.api';
import type { Product } from '../types';
import { urlImagemProduto } from '../utils/imagem';
import { useAuth, usePermissions } from '@/features/auth';
import { Button, ResponsiveTable, ConfirmDialog } from '@/shared/ui';
import { useDebounce, useBreakpoint } from '@/shared/hooks';
import { cn, exportarTabelaPDF, formatMoeda } from '@/shared/utils';
import type { ColumnDef, VisibilityState } from '@tanstack/react-table';
import { getCoreRowModel, useReactTable, createColumnHelper } from '@tanstack/react-table';
import { ProductFormModal } from './ProductFormModal';

/** Acima do maior catálogo visto em produção, para um só pedido trazer tudo. */
const LIMITE_PARA_EXPORTAR = 5000;

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
  const { t } = useTranslation('produtos');
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

  // Exporta o catálogo todo (respeitando a pesquisa activa), não só a página visível —
  // por isso busca à parte, em vez de reaproveitar `products`.
  const [aExportar, setAExportar] = useState(false);
  const exportarPDF = async () => {
    setAExportar(true);
    try {
      const todos = await catalogApi.getProducts({
        search: debouncedSearch,
        limit: LIMITE_PARA_EXPORTAR,
      });
      const linhas = todos.data ?? [];
      if (linhas.length === 0) {
        toast.error(t('lista.vazio'));
        return;
      }
      exportarTabelaPDF({
        titulo: t('lista.titulo_pdf'),
        colunas: [
          t('lista.col_produto'),
          t('lista.col_categoria'),
          t('lista.col_custo'),
          t('lista.col_venda'),
          t('lista.col_margem'),
          t('lista.col_unidade'),
        ],
        linhas: linhas.map((p) => [
          p.nome,
          p.categoria?.nome ?? t('lista.sem_categoria'),
          formatMoeda(p.precoCusto || 0),
          formatMoeda(p.precoVenda || 0),
          `${(p.margemLucro || 0).toFixed(2)}%`,
          p.unidadeMedida || 'UN',
        ]),
        nomeFicheiro: 'produtos',
      });
    } finally {
      setAExportar(false);
    }
  };

  const columns = useMemo<ColumnDef<Product, any>[]>(() => {
    const columnHelper = createColumnHelper<Product>();

    return [
      columnHelper.accessor('nome', {
        header: t('lista.col_produto'),
        cell: (info) => {
          const product = info.row.original;
          const foto = urlImagemProduto(product);
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                {foto ? (
                  <img src={foto} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon size={16} className="text-slate-300" />
                )}
              </div>
              <div>
                <div className="font-medium text-slate-900">{product.nome}</div>
                {product.codigoBarras && (
                  <div className="mt-0.5 font-mono text-xs text-slate-500">
                    EAN: {product.codigoBarras}
                  </div>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('categoria.nome', {
        header: t('lista.col_categoria'),
        cell: (info) => info.getValue() || <span className="text-slate-400">{t('lista.sem_categoria')}</span>,
      }),
      columnHelper.accessor('precoCusto', {
        header: t('lista.col_custo'),
        cell: (info) => (
          <div className="text-slate-700">
            {formatMoeda(info.getValue() || 0)}
          </div>
        ),
      }),
      columnHelper.accessor('precoVenda', {
        header: t('lista.col_venda'),
        cell: (info) => (
          <div className="font-semibold text-slate-900">
            {formatMoeda(info.getValue() || 0)}
          </div>
        ),
      }),
      columnHelper.accessor('margemLucro', {
        header: t('lista.col_margem'),
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
        header: t('lista.col_unidade'),
        cell: (info) => (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">{info.getValue() || 'UN'}</span>
            {info.row.original.isWeighable && (
              <span
                className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800"
                title={t('lista.balanca_titulo')}
              >
                {t('lista.balanca')}
              </span>
            )}
          </div>
        ),
      }),
      canManage &&
        columnHelper.display({
          id: 'actions',
          header: t('lista.col_accoes'),
          cell: (info) => {
            const product = info.row.original;
            return (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setModalState({ isOpen: true, productToEdit: product })}
                  title={t('lista.editar_produto')}
                  className="h-8 w-8"
                >
                  <Edit className="h-4 w-4 text-slate-600" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAEliminar(product)}
                  title={t('lista.eliminar_produto')}
                  className="h-8 w-8 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          },
        }),
    ].filter(Boolean) as ColumnDef<Product, any>[];
  }, [canManage, t]);

  // Lido por `useBreakpoint`, e não por `window.innerWidth`: este era medido uma
  // única vez na primeira renderização, pelo que rodar o telemóvel de retrato para
  // paisagem não recalculava nada — as colunas continuavam escondidas num ecrã que
  // já tinha espaço para elas.
  const cabeCategoria = useBreakpoint('sm');
  const cabePrecoCusto = useBreakpoint('md');
  const cabeUnidadeMedida = useBreakpoint('lg');

  const columnVisibility: VisibilityState = {
    categoria: cabeCategoria,
    precoCusto: cabePrecoCusto,
    unidadeMedida: cabeUnidadeMedida,
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
            placeholder={t('lista.pesquisar')}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 pl-9 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportarPDF}
            disabled={aExportar}
            className={cn('gap-2', aExportar && 'opacity-60')}
          >
            {aExportar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {t('exportar.pdf', { ns: 'comum' })}
          </Button>

          {canManage && (
            <Button
              onClick={() => setModalState({ isOpen: true, productToEdit: undefined })}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('lista.novo_produto')}
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <ResponsiveTable
          table={table}
          isLoading={isLoading}
          emptyMessage={
            debouncedSearch
              ? t('lista.vazio_pesquisa')
              : t('lista.vazio')
          }
        />

        {!isLoading && products.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3 text-sm">
            <span className="text-slate-500">
              {t('lista.pagina', { pagina: page, total: totalPages })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t('lista.anterior')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('lista.proxima')}
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
        title={t('lista.eliminar_titulo')}
        message={
          aEliminar
            ? t('lista.eliminar_mensagem', { nome: aEliminar.nome })
            : ''
        }
        confirmText={t('lista.eliminar_confirmar')}
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
