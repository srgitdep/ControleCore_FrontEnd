import { useState } from 'react';
import { X, PackageCheck } from 'lucide-react';
import { cn } from '@/shared/utils';

interface ReceberTransferenciaModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  quantidadeExpedida: number;
  onClose: () => void;
  onConfirm: (quantidadeRecebida: number) => void;
}

/**
 * Confirmar a recepção — DT01 §12/§18 aplicado à transferência interna.
 *
 * Pré-preenchido com o que foi expedido: a maioria das recepções bate certo, e obrigar
 * a redigitar o número correcto seria fricção sem propósito. O aviso de divergência só
 * aparece quando o valor difere do que se esperava.
 */
export function ReceberTransferenciaModal({
  isOpen,
  isSubmitting,
  quantidadeExpedida,
  onClose,
  onConfirm,
}: ReceberTransferenciaModalProps) {
  const [quantidade, setQuantidade] = useState(quantidadeExpedida);

  if (!isOpen) return null;

  const divergente = quantidade !== quantidadeExpedida;
  const invalido = !Number.isFinite(quantidade) || quantidade < 0 || quantidade > quantidadeExpedida;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <PackageCheck className="text-emerald-600" size={20} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Confirmar recepção</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-500">
          Foram expedidas <strong>{quantidadeExpedida}</strong> unidades. Confirme o que chegou de facto.
        </p>

        <input
          type="number"
          min={0}
          max={quantidadeExpedida}
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
          autoFocus
          className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
        />

        {invalido && (
          <p className="mt-1 text-xs text-rose-500">
            Não é possível receber mais do que foi expedido nem um valor negativo.
          </p>
        )}
        {!invalido && divergente && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Divergência de {quantidadeExpedida - quantidade} unidades em relação ao expedido.
            Fica registada na transferência.
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Voltar
          </button>
          <button
            disabled={invalido || isSubmitting}
            onClick={() => onConfirm(quantidade)}
            className={cn(
              'rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700',
              (invalido || isSubmitting) && 'cursor-not-allowed opacity-50',
            )}
          >
            {isSubmitting ? 'A confirmar...' : 'Confirmar recepção'}
          </button>
        </div>
      </div>
    </div>
  );
}
