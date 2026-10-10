import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils';
import type { EstadoEntrega } from '../types/estafeta';

const COR: Record<EstadoEntrega, string> = {
  AGUARDA_RECOLHA: 'bg-slate-100 text-slate-600',
  ATRIBUIDA: 'bg-sky-100 text-sky-700',
  RECOLHIDA: 'bg-indigo-100 text-indigo-700',
  EM_ROTA: 'bg-blue-100 text-blue-700',
  ENTREGUE: 'bg-emerald-100 text-emerald-700',
  FALHADA: 'bg-rose-100 text-rose-700',
  DEVOLVIDA: 'bg-slate-200 text-slate-600',
  CANCELADA: 'bg-slate-200 text-slate-600',
};

/** O estado de uma entrega, em palavras de quem a faz («Por recolher», «A caminho»). */
export function EstadoDaEntrega({ estado }: { estado: EstadoEntrega }) {
  const { t } = useTranslation('estafeta');

  return (
    <span className={cn('inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-bold', COR[estado])}>
      {t(`estados.${estado}`)}
    </span>
  );
}
