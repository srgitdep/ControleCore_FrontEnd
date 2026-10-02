import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils';

const MOTIVO_MINIMO = 5;

interface IgnorarNecessidadeModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
}

/**
 * O motivo de "Não comprar" — DT01 5 e 24.
 *
 * O backend recusa sem motivo (mínimo 5 caracteres); a validação aqui é só para dar
 * feedback antes do pedido de rede, não substitui a do servidor.
 */
export function IgnorarNecessidadeModal({
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}: IgnorarNecessidadeModalProps) {
  const { t } = useTranslation('necessidades');
  const [motivo, setMotivo] = useState('');

  if (!isOpen) return null;

  const invalido = motivo.trim().length < MOTIVO_MINIMO;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
              <AlertTriangle className="text-orange-600" size={20} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">{t('ignorar.titulo')}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label={t('ignorar.fechar')}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-500">
          {t('ignorar.descricao')}
        </p>

        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={3}
          autoFocus
          placeholder={t('ignorar.placeholder')}
          className="mt-3 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
        />
        {motivo.length > 0 && invalido && (
          <p className="mt-1 text-xs text-rose-500">{t('ignorar.minimo', { n: MOTIVO_MINIMO })}</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {t('ignorar.cancelar')}
          </button>
          <button
            disabled={invalido || isSubmitting}
            onClick={() => onConfirm(motivo.trim())}
            className={cn(
              'rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700',
              (invalido || isSubmitting) && 'cursor-not-allowed opacity-50',
            )}
          >
            {isSubmitting ? t('ignorar.a_guardar') : t('ignorar.confirmar')}
          </button>
        </div>
      </div>
    </div>
  );
}
