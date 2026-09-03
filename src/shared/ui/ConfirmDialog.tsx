import { useEffect, useRef, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

/**
 * Um motivo pedido antes de confirmar.
 *
 * Existe porque o servidor recusa cancelamentos e rejeições sem justificação — e a única
 * forma de a pedir era o `prompt` do browser, que não se pode estilizar, não diz de que
 * aplicação vem, e num telemóvel aparece colado ao topo do ecrã.
 */
export interface PedidoDeMotivo {
  /** O que se pede. «Porque está a cancelar?» */
  rotulo: string;
  placeholder?: string;
  /** Uma frase a dizer para que serve o texto — quem o vai ler, e quando. */
  ajuda?: string;
  /**
   * Obrigatório por omissão.
   *
   * Se fosse opcional, o botão passaria com o campo vazio e o servidor recusaria depois —
   * dois passos e uma mensagem de erro para dizer o que o ecrã já sabia.
   */
  obrigatorio?: boolean;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** Recebe o motivo quando `motivo` foi pedido. */
  onConfirm: (motivo?: string) => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  motivo?: PedidoDeMotivo;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'warning',
  isLoading = false,
  motivo,
}: ConfirmDialogProps) {
  const [texto, setTexto] = useState('');
  const campo = useRef<HTMLTextAreaElement>(null);

  // Limpo a cada abertura, e com o cursor lá dentro. Sem a limpeza, reabrir o diálogo para
  // outra linha traria o motivo escrito para a anterior — e a pessoa confirmaria sem reparar.
  useEffect(() => {
    if (!isOpen) return;

    setTexto('');
    const foco = setTimeout(() => campo.current?.focus(), 50);

    return () => clearTimeout(foco);
  }, [isOpen]);

  if (!isOpen) return null;

  const exigeMotivo = !!motivo && motivo.obrigatorio !== false;
  const podeConfirmar = !isLoading && (!exigeMotivo || texto.trim().length > 0);

  const confirmar = () => {
    if (!podeConfirmar) return;

    onConfirm(motivo ? texto.trim() : undefined);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="text-rose-600" size={24} />,
          bg: 'bg-rose-100',
          btn: 'bg-rose-600 hover:bg-rose-700',
        };
      case 'info':
        return {
          icon: <AlertTriangle className="text-blue-600" size={24} />,
          bg: 'bg-blue-100',
          btn: 'bg-blue-600 hover:bg-blue-700',
        };
      case 'warning':
      default:
        return {
          icon: <AlertTriangle className="text-orange-600" size={24} />,
          bg: 'bg-orange-100',
          btn: 'bg-orange-600 hover:bg-orange-700',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col transform transition-all">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${styles.bg} shrink-0`}>
              {styles.icon}
            </div>
            <div className="text-slate-600 mt-1">
              {message}
            </div>
          </div>

          {motivo && (
            <div className="mt-4">
              <label
                htmlFor="dialogo-motivo"
                className="block text-sm font-medium text-slate-700"
              >
                {motivo.rotulo}
                {!exigeMotivo && (
                  <span className="ml-1 font-normal text-slate-400">(opcional)</span>
                )}
              </label>

              <textarea
                id="dialogo-motivo"
                ref={campo}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                // Enter confirma, Shift+Enter faz parágrafo. Um motivo é quase sempre uma
                // linha, e obrigar a ir com o rato ao botão torna lento o que é frequente.
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    confirmar();
                  }
                }}
                rows={2}
                disabled={isLoading}
                placeholder={motivo.placeholder}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none disabled:bg-slate-50"
              />

              {motivo.ajuda && (
                <p className="mt-1 text-xs text-slate-400">{motivo.ajuda}</p>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 mt-auto">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={!podeConfirmar}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70 ${styles.btn}`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                A processar...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
