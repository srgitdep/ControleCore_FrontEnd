import { ArrowLeft } from 'lucide-react';
import { cn } from '@/shared/utils';

/**
 * O caminho de volta.
 *
 * ## Porque é um componente e não três cópias
 *
 * O mesmo botão estava escrito à mão no detalhe do stock, com as classes todas em linha. À
 * quarta cópia, cada uma teria a sua margem e o seu tom de cinzento — e o utilizador aprenderia
 * que «voltar» tem quatro aspectos diferentes conforme o ecrã.
 *
 * ## `aoVoltar` e não sempre o histórico
 *
 * Dentro de separadores não há histórico a que voltar: mudar de separador não navegou para
 * lado nenhum. Quem chama diz para onde vai — e quando não diz, recua no histórico, que é o
 * comportamento certo para um ecrã que foi mesmo aberto a partir de outro.
 */
export interface BotaoVoltarProps {
  /** Para onde. Omitir recua no histórico do browser. */
  aoVoltar?: () => void;
  /** O que se está a deixar. «Voltar a Pedidos» diz mais do que «Voltar». */
  destino?: string;
  className?: string;
}

export function BotaoVoltar({ aoVoltar, destino, className }: BotaoVoltarProps) {
  return (
    <button
      type="button"
      onClick={() => (aoVoltar ? aoVoltar() : window.history.back())}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5',
        'text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50',
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {destino ? `Voltar a ${destino}` : 'Voltar'}
    </button>
  );
}
