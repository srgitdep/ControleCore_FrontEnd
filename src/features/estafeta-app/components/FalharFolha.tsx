import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils';
import { MOTIVOS_FALHA } from '../types/estafeta';
import type { DadosDeFalha, MotivoFalha } from '../types/estafeta';
import { Folha } from './Folha';

/**
 * «Não consegui entregar»: o motivo, de uma lista fechada (e uma nota com «outro»). A mercadoria regressa
 * à loja e é o gestor quem a devolve — o estafeta não anula nada.
 */
export function FalharFolha({
  aProcessar,
  aoConfirmar,
  aoFechar,
}: {
  aProcessar: boolean;
  aoConfirmar: (dados: DadosDeFalha) => void;
  aoFechar: () => void;
}) {
  const { t } = useTranslation('estafeta');
  const [motivo, setMotivo] = useState<MotivoFalha | null>(null);
  const [nota, setNota] = useState('');

  const precisaNota = motivo === 'OUTRO';
  const pode = motivo !== null && (!precisaNota || nota.trim() !== '') && !aProcessar;

  return (
    <Folha titulo={t('falhar.titulo')} aoFechar={aoFechar}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!pode || !motivo) return;
          aoConfirmar({ motivo, ...(nota.trim() ? { nota: nota.trim() } : {}) });
        }}
      >
        <p className="text-sm text-slate-500">{t('falhar.aviso')}</p>

        <fieldset className="space-y-2">
          <legend className="sr-only">{t('falhar.motivo')}</legend>
          {MOTIVOS_FALHA.map((m) => (
            <label
              key={m}
              className={cn(
                'flex min-h-14 cursor-pointer items-center rounded-xl border-2 px-4 text-base font-medium',
                motivo === m ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-700',
              )}
            >
              <input type="radio" name="motivo" value={m} checked={motivo === m} onChange={() => setMotivo(m)} className="sr-only" />
              {t(`motivo.${m}`)}
            </label>
          ))}
        </fieldset>

        {(precisaNota || nota !== '') && (
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="nota-falha">
              {t('falhar.nota')}
              {precisaNota && ' *'}
            </label>
            <textarea
              id="nota-falha"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              maxLength={300}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={!pode}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 text-base font-bold text-white disabled:opacity-50"
        >
          {aProcessar && <Loader2 size={18} className="animate-spin" />}
          {t('falhar.confirmar')}
        </button>
      </form>
    </Folha>
  );
}
