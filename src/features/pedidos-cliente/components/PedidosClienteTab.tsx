import { useMemo } from 'react';
import { useReactTable, getCoreRowModel, createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { ResponsiveTable } from '@/shared/ui';
import { formatDataHora } from '@/shared/utils';
import { useRankingPedidosCliente } from '../hooks/usePedidosCliente';
import type { RankingPedidoCliente } from '../api/pedidosCliente.api';

const columnHelper = createColumnHelper<RankingPedidoCliente>();

/**
 * O que os clientes pedem no balcão e a loja não vende, agrupado por produto e
 * ordenado do mais pedido ao menos pedido — o sinal mais directo do que falta
 * trazer ao catálogo.
 */
export function PedidosClienteTab() {
  const { t } = useTranslation('stock');
  const { data, isLoading } = useRankingPedidosCliente();
  const pedidos = data ?? [];

  const columns = useMemo<ColumnDef<RankingPedidoCliente, any>[]>(
    () => [
      columnHelper.accessor('nomeProduto', {
        header: t('pedidosCliente.col_produto'),
        cell: ({ getValue }) => <span className="font-semibold text-slate-900">{getValue()}</span>,
      }),
      columnHelper.accessor('totalPedidos', {
        header: t('pedidosCliente.col_total'),
        cell: ({ getValue }) => (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
            {getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('ultimoPedidoEm', {
        header: t('pedidosCliente.col_ultimo'),
        cell: ({ getValue }) => (
          <span className="text-sm text-slate-500">{formatDataHora(getValue())}</span>
        ),
      }),
    ],
    [t],
  );

  const table = useReactTable({
    data: pedidos,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900">{t('pedidosCliente.titulo')}</h3>
        <p className="text-sm text-slate-500">{t('pedidosCliente.subtitulo')}</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <ResponsiveTable
          table={table}
          isLoading={isLoading}
          emptyMessage={t('pedidosCliente.vazio')}
        />
      </div>
    </div>
  );
}
