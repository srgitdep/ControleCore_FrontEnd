import { useState } from 'react';
import { AlertTriangle, LifeBuoy, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import { mensagemDeErro } from '@/shared/utils';
import { useModoSuporte } from '../hooks/useSuporte';

interface EntrarSuporteDialogProps {
  empresaId: string;
  empresaNome: string;
  onClose: () => void;
}

/**
 * Entrar numa empresa em modo suporte (plano §4.15, S3). O motivo é obrigatório porque a
 * empresa o vê na lista das visitas; a escrita fica desligada por omissão e avisa o que
 * implica — quem escreve em suporte escreve como o ADMIN dela, com o nome do Super Admin
 * na auditoria.
 */
export function EntrarSuporteDialog({ empresaId, empresaNome, onClose }: EntrarSuporteDialogProps) {
  const { t } = useTranslation('suporte');
  const { entrar } = useModoSuporte();
  const [motivo, setMotivo] = useState('');
  const [escrita, setEscrita] = useState(false);

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();
    entrar.mutate(
      { empresaId, motivo: motivo.trim(), escrita },
      {
        onSuccess: onClose,
        onError: (erro) => toast.error(mensagemDeErro(erro, t('entrar.erro'))),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <form onSubmit={submeter} className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <LifeBuoy size={18} />
            {t('entrar.titulo')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={entrar.isPending}
            aria-label={t('entrar.fechar')}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <p className="text-sm text-slate-600">{t('entrar.texto', { empresa: empresaNome })}</p>

          <div>
            <label htmlFor="sup-motivo" className="mb-1 block text-sm font-medium text-slate-700">
              {t('entrar.motivo')}
            </label>
            <textarea
              id="sup-motivo"
              autoFocus
              rows={3}
              maxLength={500}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={t('entrar.motivo_dica')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">{t('entrar.motivo_visivel')}</p>
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={escrita}
              onChange={(e) => setEscrita(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>{t('entrar.escrita')}</span>
          </label>
          {escrita && (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              {t('entrar.aviso_escrita')}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={entrar.isPending}>
              {t('entrar.cancelar')}
            </Button>
            <Button type="submit" disabled={!motivo.trim() || entrar.isPending}>
              {entrar.isPending && <Loader2 size={16} className="animate-spin" />}
              {t('entrar.confirmar')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
