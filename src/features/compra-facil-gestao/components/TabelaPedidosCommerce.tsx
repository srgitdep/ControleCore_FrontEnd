import { useMemo } from 'react';
import { useReactTable, getCoreRowModel, createColumnHelper } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { Truck } from 'lucide-react';
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
  const { t } = useTranslation('lojaGestao');
  const colunas = useMemo(
    () => [
      helper.accessor('numeroPedido', {
        header: t('tabela.col_pedido'),
        cell: (info) => {
          const pedido = info.row.original;
          return (
            <button type="button" onClick={() => onAbrir(pedido)} className="text-left font-medium text-slate-800 hover:underline">
              {pedido.numeroPedido}
              {pedido.tipoEntrega === 'ENTREGA' && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                  <Truck size={10} />
                  {t('tabela.entrega')}
                </span>
              )}
            </button>
          );
        },
      }),
      helper.accessor('cliente.nome', {
        header: t('tabela.col_cliente'),
        cell: (info) => <span className="text-sm text-slate-600">{info.getValue()}</span>,
      }),
      helper.accessor('loja.nome', {
        header: t('tabela.col_loja'),
        cell: (info) => <span className="text-sm text-slate-600">{info.getValue()}</span>,
      }),
      helper.accessor('estado', {
        header: t('tabela.col_estado'),
        cell: (info) => <BadgeEstadoPedidoCommerce estado={info.getValue()} />,
      }),
      helper.accessor('totalFinal', {
        header: t('tabela.col_total'),
        cell: (info) => <span className="text-sm font-medium tabular-nums text-slate-800">{formatMoeda(info.getValue())}</span>,
      }),
      helper.accessor('createdAt', {
        header: t('tabela.col_criado'),
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
            {t('tabela.abrir')}
          </button>
        ),
      }),
    ],
    [onAbrir, t],
  );

  const table = useReactTable({
    data: pedidos,
    columns: colunas,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (p) => p.id,
  });

  return <ResponsiveTable table={table} isLoading={isLoading} emptyMessage={t('tabela.vazio')} />;
}
