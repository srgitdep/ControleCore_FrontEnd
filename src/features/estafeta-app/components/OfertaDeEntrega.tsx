import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, MapPin, Store, Wallet } from 'lucide-react';
import { cn, formatarDistancia, formatMoeda } from '@/shared/utils';
import type { OfertaDeEntrega as Oferta } from '../types/onboarding';

/** O prazo de uma oferta, para a barra de tempo (30 s no servidor; só serve para pintar a barra). */
const PRAZO_TOTAL_S = 30;

/**
 * A oferta de uma entrega ao estafeta da plataforma (plano §4.9, D7): uma folha por cima de tudo, com a loja, a
 * distância, o que ganha e o tempo que tem. **Nada do cliente** — o nome, o telefone e a morada só aparecem depois
 * de aceitar, na própria entrega: quem recusa não fica a saber onde mora uma pessoa.
 *
 * É um diálogo modal (`role="alertdialog"`): a oferta tem 30 segundos e o estafeta pode estar com o telemóvel numa
 * mão, pelo que os botões são grandes e o foco vai para «Aceitar» ao abrir.
 */
export function OfertaDeEntrega({
  oferta,
  segundosRestantes,
  aceitar,
  recusar,
  aAceitar,
  aRecusar,
}: {
  oferta: Oferta;
  segundosRestantes: number;
  aceitar: () => void;
  recusar: () => void;
  aAceitar: boolean;
  aRecusar: boolean;
}) {
  const { t } = useTranslation('estafeta');
  const botaoAceitar = useRef<HTMLButtonElement>(null);
  const ocupado = aAceitar || aRecusar;

  useEffect(() => {
    botaoAceitar.current?.focus();
  }, [oferta.id]);

  const proporcao = Math.min(1, Math.max(0, segundosRestantes / PRAZO_TOTAL_S));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-3 sm:items-center">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="oferta-titulo"
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* A barra do tempo: esvazia-se; nos últimos 8 s fica vermelha. */}
        <div className="h-1.5 w-full bg-slate-100" aria-hidden>
          <div
            className={cn('h-full transition-all duration-1000 ease-linear', segundosRestantes <= 8 ? 'bg-red-500' : 'bg-emerald-500')}
            style={{ width: `${proporcao * 100}%` }}
          />
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 id="oferta-titulo" className="text-lg font-bold text-slate-900">
              {t('oferta.titulo')}
            </h2>
            <span
              className={cn('shrink-0 rounded-full px-3 py-1 text-sm font-bold tabular-nums', segundosRestantes <= 8 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700')}
              role="timer"
              aria-live="off"
            >
              {t('oferta.segundos', { count: segundosRestantes })}
            </span>
          </div>

          <dl className="space-y-3">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <Store size={20} className="shrink-0 text-slate-500" aria-hidden />
              <div className="min-w-0">
                <dt className="text-xs text-slate-500">{t('oferta.loja')}</dt>
                <dd className="truncate text-base font-bold text-slate-900">{oferta.lojaNome}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <MapPin size={20} className="shrink-0 text-slate-500" aria-hidden />
              <div>
                <dt className="text-xs text-slate-500">{t('oferta.distancia_etiqueta')}</dt>
                <dd className="text-base font-bold text-slate-900">{formatarDistancia(oferta.distanciaMetros)}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-3">
              <Wallet size={20} className="shrink-0 text-emerald-600" aria-hidden />
              <div>
                <dt className="text-xs text-emerald-700">{t('oferta.recebe')}</dt>
                <dd className="text-lg font-bold text-emerald-900">{formatMoeda(oferta.taxa)}</dd>
              </div>
            </div>
          </dl>

          <p className="text-xs text-slate-500">{t('oferta.aviso_cliente')}</p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={recusar}
              disabled={ocupado}
              className="flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-slate-100 px-4 text-base font-bold text-slate-700 active:bg-slate-200 disabled:opacity-50"
            >
              {aRecusar ? <Loader2 size={18} className="animate-spin" /> : t('oferta.recusar')}
            </button>
            <button
              ref={botaoAceitar}
              type="button"
              onClick={aceitar}
              disabled={ocupado}
              className="flex min-h-14 flex-[2] items-center justify-center rounded-2xl bg-emerald-600 px-4 text-base font-bold text-white active:bg-emerald-700 disabled:opacity-50"
            >
              {aAceitar ? <Loader2 size={18} className="animate-spin" /> : t('oferta.aceitar')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
