import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { cn } from '@/shared/utils';

interface Props {
  titulo: string;
  descricao?: string;
  textoConfirmar: string;
  corConfirmar?: 'blue' | 'rose';
  onConfirmar: (motivo: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Pede um motivo antes de uma acção irreversível ou que fica no histórico.
 *
 * Reabrir e cancelar partilham esta forma porque partilham a mesma exigência do backend: o
 * motivo é obrigatório e é o que fica registado para quem ler a auditoria depois.
 */
export function MotivoModal({
  titulo,
  descricao,
  textoConfirmar,
  corConfirmar = 'blue',
  onConfirmar,
  onClose,
}: Props) {
  const [motivo, setMotivo] = useState('');
  const [aGravar, setAGravar] = useState(false);
  const [erro, setErro] = useState('');

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (motivo.trim().length < 5) {
      setErro('Indique o motivo — fica registado para quem ler o histórico desta requisição.');
      return;
    }

    setAGravar(true);
    try {
      await onConfirmar(motivo.trim());
    } finally {
      setAGravar(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form onSubmit={confirmar} className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-400">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-3 px-5 py-5">
          {descricao && <p className="text-xs text-slate-500">{descricao}</p>}

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Motivo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                if (erro) setErro('');
              }}
              rows={3}
              autoFocus
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
          </div>
        </div>

        <footer className="flex justify-end gap-2 rounded-b-xl border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
          >
            Voltar
          </button>
          <button
            type="submit"
            disabled={aGravar}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50',
              corConfirmar === 'rose' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700',
            )}
          >
            {aGravar && <Loader2 size={15} className="animate-spin" />}
            {textoConfirmar}
          </button>
        </footer>
      </form>
    </div>
  );
}
