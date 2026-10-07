import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils';
import type { EstadoPedidoCommerce } from '../types/pedido-commerce-gestao.types';

const COR: Record<EstadoPedidoCommerce, string> = {
  CRIADO: 'bg-amber-100 text-amber-800',
  CONFIRMADO: 'bg-blue-100 text-blue-800',
  EM_PREPARACAO: 'bg-purple-100 text-purple-700',
  PRONTO: 'bg-emerald-100 text-emerald-700',
  EXPEDIDO: 'bg-sky-100 text-sky-700',
  EM_ROTA: 'bg-sky-100 text-sky-700',
  FALHADA: 'bg-orange-100 text-orange-700',
  CONCLUIDO: 'bg-slate-100 text-slate-600',
  CANCELADO: 'bg-rose-100 text-rose-700',
};

/**
 * `tipoEntrega` só serve para o rótulo de `PRONTO`: um pedido para entregar não está «pronto
 * para levantar».
 */
export function BadgeEstadoPedidoCommerce({
  estado,
  tipoEntrega,
}: {
  estado: EstadoPedidoCommerce;
  tipoEntrega?: 'LEVANTAMENTO' | 'ENTREGA';
}) {
  const { t } = useTranslation('lojaGestao');
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', COR[estado])}>
      {estado === 'PRONTO' && tipoEntrega === 'ENTREGA' ? t('estado.PRONTO_ENTREGA') : t(`estado.${estado}`)}
    </span>
  );
}
