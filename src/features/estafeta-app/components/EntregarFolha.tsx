import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { cn, formatMoeda } from '@/shared/utils';
import { diferencaDeCobranca, exigeReferencia } from '../domain/passos';
import { METODOS_COBRANCA } from '../types/estafeta';
import type { DadosDeEntrega, MetodoCobranca } from '../types/estafeta';
import { Folha } from './Folha';

const classeCampo =
  'mt-1 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-base focus:border-blue-500 focus:outline-none';

/**
 * «Entreguei»: como o cliente pagou à porta, a referência (M-Pesa e e-Mola) e o que de facto cobrou.
 *
 * O valor vem preenchido com o previsto; uma diferença **não bloqueia** — regista-se, e o gestor vê-a no
 * acerto (Fase 3). Mas é dita aqui, em palavras, para o estafeta não a deixar passar sem reparar.
 */
export function EntregarFolha({
  valorACobrar,
  aProcessar,
  aoConfirmar,
  aoFechar,
}: {
  valorACobrar: number;
  aProcessar: boolean;
  aoConfirmar: (dados: DadosDeEntrega) => void;
  aoFechar: () => void;
}) {
  const { t } = useTranslation('estafeta');
  const [metodo, setMetodo] = useState<MetodoCobranca>('NUMERARIO');
  const [referencia, setReferencia] = useState('');
  const [valor, setValor] = useState(String(valorACobrar));

  const cobrado = Number(valor.replace(',', '.'));
  const valorValido = valor.trim() !== '' && Number.isFinite(cobrado) && cobrado >= 0;
  const precisaReferencia = exigeReferencia(metodo);
  const diferenca = valorValido ? diferencaDeCobranca(valorACobrar, cobrado) : 0;
  const pode = valorValido && (!precisaReferencia || referencia.trim() !== '') && !aProcessar;

  return (
    <Folha titulo={t('entregar.titulo')} aoFechar={aoFechar}>
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!pode) return;
          aoConfirmar({
            metodoCobrado: metodo,
            ...(precisaReferencia ? { referenciaPagamento: referencia.trim() } : {}),
            valorCobrado: cobrado,
          });
        }}
      >
        <fieldset>
          <legend className="text-sm font-semibold text-slate-700">{t('entregar.metodo')}</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {METODOS_COBRANCA.map((m) => (
              <label
                key={m}
                className={cn(
                  'flex min-h-14 cursor-pointer items-center justify-center rounded-xl border-2 px-2 text-center text-sm font-semibold',
                  metodo === m ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600',
                )}
              >
                <input type="radio" name="metodo" value={m} checked={metodo === m} onChange={() => setMetodo(m)} className="sr-only" />
                {t(`metodo.${m}`)}
              </label>
            ))}
          </div>
        </fieldset>

        {precisaReferencia && (
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="referencia">
              {t('entregar.referencia')} *
            </label>
            <input
              id="referencia"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              maxLength={80}
              autoComplete="off"
              autoCapitalize="characters"
              className={classeCampo}
            />
            <p className="mt-1 text-xs text-slate-400">{t('entregar.referencia_ajuda')}</p>
          </div>
        )}

        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="valor-cobrado">
            {t('entregar.valor_cobrado')}
          </label>
          <input
            id="valor-cobrado"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            inputMode="decimal"
            className={classeCampo}
          />
          <p className="mt-1 text-xs text-slate-400">{t('entregar.previsto', { valor: formatMoeda(valorACobrar) })}</p>
          {diferenca !== 0 && (
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800" role="status">
              {diferenca > 0
                ? t('entregar.diferenca_mais', { valor: formatMoeda(diferenca) })
                : t('entregar.diferenca_menos', { valor: formatMoeda(Math.abs(diferenca)) })}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!pode}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-base font-bold text-white disabled:opacity-50"
        >
          {aProcessar && <Loader2 size={18} className="animate-spin" />}
          {t('entregar.confirmar')}
        </button>
      </form>
    </Folha>
  );
}
