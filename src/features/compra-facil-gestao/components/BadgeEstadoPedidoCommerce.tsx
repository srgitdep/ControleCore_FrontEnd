import { cn } from '@/shared/utils';
import { ETIQUETA_ESTADO_PEDIDO_COMMERCE, type EstadoPedidoCommerce } from '../types/pedido-commerce-gestao.types';

const COR: Record<EstadoPedidoCommerce, string> = {
  CRIADO: 'bg-amber-100 text-amber-800',
  AGUARDA_CONFIRMACAO: 'bg-amber-100 text-amber-800',
  CONFIRMADO: 'bg-blue-100 text-blue-800',
  EM_PREPARACAO: 'bg-purple-100 text-purple-700',
  PRONTO: 'bg-emerald-100 text-emerald-700',
  AGUARDA_LEVANTAMENTO: 'bg-emerald-100 text-emerald-700',
  CONCLUIDO: 'bg-slate-100 text-slate-600',
  CANCELADO: 'bg-rose-100 text-rose-700',
};

export function BadgeEstadoPedidoCommerce({ estado }: { estado: EstadoPedidoCommerce }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', COR[estado])}>
      {ETIQUETA_ESTADO_PEDIDO_COMMERCE[estado]}
    </span>
  );
}
