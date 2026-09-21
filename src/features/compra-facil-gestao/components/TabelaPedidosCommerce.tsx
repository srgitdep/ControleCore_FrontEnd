import { useMemo } from 'react';
import { useReactTable, getCoreRowModel, createColumnHelper } from '@tanstack/react-table';
import { formatDataHora, formatMoeda } from '@/shared/utils';
import { ResponsiveTable } from '@/shared/ui';
import { BadgeEstadoPedidoCommerce } from './BadgeEstadoPedidoCommerce';
import type { PedidoCommerceGestao } from '../types/pedido-commerce-gestao.types';

const helper = createColumnHelper<PedidoCommerceGestao>();

interface TabelaPedidosCommerceProps {
  pedidos: PedidoCommerceGestao[];
  isLoading: boolean;
  onAbrir: (pedido: PedidoCommerceGestao) => void;
}

export function TabelaPedidosCommerce({ pedidos, isLoading, onAbrir }: TabelaPedidosCommerceProps) {
  const colunas = useMemo(
    () => [
      helper.accessor('numeroPedido', {
        header: 'Pedido',
        cell: (info) => {
          const pedido = info.row.original;
          return (
            <button type="button" onClick={() => onAbrir(pedido)} className="text-left font-medium text-slate-800 hover:underline">
              {pedido.numeroPedido}
            </button>
          );
        },
      }),
      helper.accessor('cliente.nome', {
        header: 'Cliente',
        cell: (info) => <span className="text-sm text-slate-600">{info.getValue()}</span>,
      }),
      helper.accessor('loja.nome', {
        header: 'Loja',
        cell: (info) => <span className="text-sm text-slate-600">{info.getValue()}</span>,
      }),
      helper.accessor('estado', {
        header: 'Estado',
        cell: (info) => <BadgeEstadoPedidoCommerce estado={info.getValue()} />,
      }),
      helper.accessor('totalFinal', {
        header: 'Total',
        cell: (info) => <span className="text-sm font-medium tabular-nums text-slate-800">{formatMoeda(info.getValue())}</span>,
      }),
      helper.accessor('createdAt', {
        header: 'Criado',
        cell: (info) => <span className="text-xs text-slate-400">{formatDataHora(info.getValue())}</span>,
      }),
      helper.display({
        id: 'accao',
        header: '',
        cell: (info) => (
          <button
            type="button"
            onClick={() => onAbrir(info.row.original)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Abrir
          </button>
        ),
      }),
    ],
    [onAbrir],
  );

  const table = useReactTable({
    data: pedidos,
    columns: colunas,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (p) => p.id,
  });

  return <ResponsiveTable table={table} isLoading={isLoading} emptyMessage="Nenhum pedido do Compra Fácil nesta fila." />;
}
