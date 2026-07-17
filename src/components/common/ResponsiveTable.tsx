import { type Table, flexRender } from '@tanstack/react-table';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ──â”€ CVA: variantes de linha para destacar estados crÍticos ──────────────────
const rowVariants = cva('transition-colors', {
  variants: {
    status: {
      default: 'hover:bg-slate-50/60',
      critical: 'bg-red-50/60 hover:bg-red-50',
      warning: 'bg-amber-50/60 hover:bg-amber-50',
    },
  },
  defaultVariants: { status: 'default' },
});

// ──â”€ Types ────────────────────────────────────────────────────────────────────
interface ResponsiveTableProps<TData> {
  table: Table<TData>;
  isLoading?: boolean;
  emptyMessage?: string;
  /** Função opcional para determinar a variante da linha com base no dado */
  getRowStatus?: (row: TData) => 'default' | 'critical' | 'warning';
}

// ──â”€ Component ────────────────────────────────────────────────────────────────
export function ResponsiveTable<TData>({
  table,
  isLoading = false,
  emptyMessage = 'Nenhum registo encontrado.',
  getRowStatus,
}: ResponsiveTableProps<TData>) {
  const rows = table.getRowModel().rows;
  const headerGroups = table.getHeaderGroups();

  // ──â”€ Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-slate-600" />
        <span className="text-sm">A carregar dados...</span>
      </div>
    );
  }

  // ──â”€ Empty state ──────────────────────────────────────────────────────────
  if (rows.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-slate-400">{emptyMessage}</div>
    );
  }

  return (
    <>
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          DESKTOP (sm+): Tabela semântica tradicional
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-slate-100 bg-slate-50"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const status = getRowStatus ? getRowStatus(row.original) : 'default';
              return (
                <tr key={row.id} className={cn(rowVariants({ status }))}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm text-slate-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MOBILE (max-sm): Card layout vertical
          Cada linha vira um card; o thead é ocultado via CSS.
          O header da coluna é exibido via data-label em cada célula.
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="flex flex-col gap-3 p-3 sm:hidden">
        {rows.map((row) => {
          const status = getRowStatus ? getRowStatus(row.original) : 'default';
          return (
            <div
              key={row.id}
              className={cn(
                'rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden',
                status === 'critical' && 'border-red-200 bg-red-50/40',
                status === 'warning' && 'border-amber-200 bg-amber-50/40',
              )}
            >
              {row.getVisibleCells().map((cell) => {
                // Resolve o header textual da coluna para usar como rótulo no card
                const headerDef = cell.column.columnDef.header;
                const headerLabel =
                  typeof headerDef === 'string'
                    ? headerDef
                    : cell.column.id;

                return (
                  <div
                    key={cell.id}
                    className="flex items-start justify-between gap-2 px-4 py-2.5 border-b border-slate-100/80 last:border-b-0"
                  >
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide shrink-0 pt-0.5">
                      {headerLabel}
                    </span>
                    <span className="text-sm text-slate-800 text-right">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}
