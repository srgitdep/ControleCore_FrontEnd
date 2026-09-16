import { cn } from '@/shared/utils';
import { ESTADO_TRANSFERENCIA_LABEL, type EstadoTransferencia } from '../types/transferencia.types';

const COR: Record<EstadoTransferencia, string> = {
  SOLICITADA: 'bg-amber-100 text-amber-800',
  APROVADA: 'bg-blue-100 text-blue-800',
  EXPEDIDA: 'bg-purple-100 text-purple-700',
  RECEBIDA: 'bg-emerald-100 text-emerald-700',
  CANCELADA: 'bg-slate-100 text-slate-500',
};

export function BadgeEstadoTransferencia({ estado }: { estado: EstadoTransferencia }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', COR[estado])}>
      {ESTADO_TRANSFERENCIA_LABEL[estado]}
    </span>
  );
}
