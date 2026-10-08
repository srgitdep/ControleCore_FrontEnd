import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, X } from 'lucide-react';
import { cn, formatData, formatMoeda } from '@/shared/utils';
import type { AcertoPendente } from '../types/operacao';

const classeCampo =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none';

/**
 * Acertar as contas de um estafeta (US-11): o gestor confere as entregas, regista o que ele
 * entregou de facto, e o dinheiro entra no caixa.
 *
 * A diferença aparece **em tempo real** e **nunca bloqueia** o botão: entregar menos fica
 * registado como diferença. Bloquear por 50 MZN deixava o estafeta sem poder acabar o turno, com
 * o dinheiro que trouxe ainda na rua. O que entra no caixa é o que foi entregue, não o devido.
 */
export function AcertarDialog({
  pendente,
  aProcessar,
  aoConfirmar,
  aoFechar,
}: {
  pendente: AcertoPendente;
  aProcessar: boolean;
  aoConfirmar: (corpo: { totalEntregue: number; notas?: string }) => void;
  aoFechar: () => void;
}) {
  const { t } = useTranslation('entrega');
  // Pré-preenchido com o devido: o caso comum é o estafeta trazer exactamente o que cobrou.
  const [entregue, setEntregue] = useState(String(pendente.valorEmAberto));
  const [notas, setNotas] = useState('');

  const valor = Number(entregue);
  const valido = entregue.trim() !== '' && Number.isFinite(valor) && valor >= 0;
  const diferenca = valido ? Math.round((valor - pendente.valorEmAberto) * 100) / 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}
      onKeyDown={(e) => e.key === 'Escape' && aoFechar()}
      role="dialog"
      aria-modal="true"
    >
      <form
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (valido) aoConfirmar({ totalEntregue: valor, ...(notas.trim() ? { notas: notas.trim() } : {}) });
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">
            {t('acertos.dialogo.titulo', { nome: pendente.estafeta.nome })}
          </h2>
          <button type="button" onClick={aoFechar} aria-label="×" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {t('acertos.dialogo.entregas', { count: pendente.entregasPendentes })}
            </h3>
            <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
              {pendente.entregas.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="text-slate-700">
                    {e.numeroPedido}
                    {e.entregueEm && <span className="ml-2 text-xs text-slate-400">{formatData(e.entregueEm)}</span>}
                  </span>
                  <span className="shrink-0 font-medium text-slate-900">
                    {formatMoeda(e.valor)}
                    {e.valor !== e.valorACobrar && (
                      <span className="ml-1 text-xs font-normal text-amber-700">
                        ({t('acertos.dialogo.previsto', { valor: formatMoeda(e.valorACobrar) })})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-baseline justify-between rounded-lg bg-slate-50 px-3 py-2">
            <span className="text-sm text-slate-600">{t('acertos.dialogo.total_devido')}</span>
            <span className="text-lg font-extrabold text-slate-900">{formatMoeda(pendente.valorEmAberto)}</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">{t('acertos.dialogo.entregou')} *</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={entregue}
              onChange={(e) => setEntregue(e.target.value)}
              className={classeCampo}
              autoFocus
              aria-describedby="diferenca-acerto"
            />
            <p
              id="diferenca-acerto"
              className={cn(
                'mt-1.5 text-xs font-medium',
                diferenca === 0 ? 'text-emerald-700' : 'text-amber-700',
              )}
              aria-live="polite"
            >
              {diferenca === 0
                ? t('acertos.dialogo.sem_diferenca')
                : t(diferenca < 0 ? 'acertos.dialogo.falta' : 'acertos.dialogo.sobra', {
                    valor: formatMoeda(Math.abs(diferenca)),
                  })}
            </p>
            {diferenca !== 0 && <p className="mt-1 text-xs text-slate-400">{t('acertos.dialogo.nao_bloqueia')}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">{t('acertos.dialogo.notas')}</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={300} rows={2} className={classeCampo} />
          </div>

          <p className="text-xs text-slate-500">{t('acertos.dialogo.caixa_aviso')}</p>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button type="button" onClick={aoFechar} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            {t('dialogo.cancelar')}
          </button>
          <button
            type="submit"
            disabled={!valido || aProcessar}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {aProcessar && <Loader2 size={14} className="animate-spin" />}
            {t('acertos.dialogo.confirmar')}
          </button>
        </div>
      </form>
    </div>
  );
}
