import { AlertTriangle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { localeIntl } from '@/i18n';
import type { MinhaAssinatura } from '../types';

/**
 * A faixa no topo do ERP e do POS (plano §4.15, P5): antes do fim e durante a tolerância,
 * com os dias que faltam. No POS também — a loja não pode descobrir o bloqueio a meio de
 * uma venda. Fina e sem botão de fechar: é para estar lá até alguém pagar.
 */
export function AvisoAssinatura({ assinatura }: { assinatura: MinhaAssinatura | undefined }) {
  const { t } = useTranslation('assinatura');
  if (!assinatura?.aplicavel) return null;
  const { aviso, dias, fimDoPeriodo } = assinatura;
  if (aviso !== 'FIM_PROXIMO' && aviso !== 'TOLERANCIA') return null;

  const data = fimDoPeriodo ? new Date(fimDoPeriodo).toLocaleDateString(localeIntl()) : '';
  const tolerancia = aviso === 'TOLERANCIA';

  return (
    <div
      role="status"
      className={`flex shrink-0 items-start gap-2 px-4 py-2 text-sm sm:items-center ${
        tolerancia ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-900'
      }`}
    >
      {tolerancia ? (
        <AlertTriangle size={16} className="mt-0.5 shrink-0 sm:mt-0" />
      ) : (
        <Clock size={16} className="mt-0.5 shrink-0 sm:mt-0" />
      )}
      <span>
        {tolerancia
          ? t('aviso.tolerancia', { count: dias ?? 0, data })
          : t('aviso.fim_proximo', { count: dias ?? 0, data })}
      </span>
    </div>
  );
}
