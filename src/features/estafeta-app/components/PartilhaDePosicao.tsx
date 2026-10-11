import { useTranslation } from 'react-i18next';
import { LocateFixed, LocateOff, MapPin, TriangleAlert } from 'lucide-react';
import { useEmitirPosicao } from '../hooks/useEmitirPosicao';

/**
 * O aviso **permanente** da partilha de posição (plano §4.6, D7). Fica no topo de todos os ecrãs da
 * aplicação enquanto houver uma entrega em rota — o estafeta tem de saber, a cada momento, se está a ser
 * localizado, por quem, e o que fazer para que funcione.
 *
 * A mensagem sobre o segundo plano é a limitação real de uma PWA: com o ecrã apagado ou outra
 * aplicação à frente, o navegador pára a localização. Escondê-la deixaria o cliente a ver «sem posição
 * recente» sem o estafeta perceber porquê.
 */
export function PartilhaDePosicao({ emRota }: { emRota: boolean }) {
  const { t } = useTranslation('estafeta');
  const { estado, consentir } = useEmitirPosicao(emRota);

  if (estado === 'inactiva') return null;

  if (estado === 'precisa_consentimento') {
    return (
      <section className="mx-4 mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-4" role="alertdialog" aria-labelledby="partilha-titulo">
        <h2 id="partilha-titulo" className="flex items-center gap-2 text-sm font-bold text-blue-900">
          <MapPin size={16} />
          {t('partilha.consentimento_titulo')}
        </h2>
        <p className="mt-2 text-sm text-blue-900">{t('partilha.consentimento_texto')}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-blue-900">
          <li>{t('partilha.consentimento_so_em_rota')}</li>
          <li>{t('partilha.consentimento_quem_ve')}</li>
          <li>{t('partilha.consentimento_sem_historico')}</li>
        </ul>
        <button
          type="button"
          onClick={consentir}
          className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white active:bg-blue-700"
        >
          {t('partilha.consentimento_aceitar')}
        </button>
      </section>
    );
  }

  if (estado === 'sem_suporte') {
    return (
      <p className="mx-4 mt-3 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900" role="alert">
        <LocateOff size={16} className="mt-0.5 shrink-0" />
        {t('partilha.sem_suporte')}
      </p>
    );
  }

  if (estado === 'negada') {
    return (
      <p className="mx-4 mt-3 flex items-start gap-2 rounded-2xl bg-red-50 p-3 text-sm text-red-800" role="alert">
        <LocateOff size={16} className="mt-0.5 shrink-0" />
        {t('partilha.negada')}
      </p>
    );
  }

  const aPartilhar = estado === 'a_partilhar';
  return (
    <div
      className={`mx-4 mt-3 rounded-2xl p-3 text-sm ${aPartilhar ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}
      role="status"
    >
      <p className="flex items-center gap-2 font-semibold">
        {aPartilhar ? <LocateFixed size={16} className="shrink-0" /> : <TriangleAlert size={16} className="shrink-0" />}
        {aPartilhar ? t('partilha.a_partilhar') : t('partilha.sem_canal')}
      </p>
      <p className="mt-1 text-xs opacity-90">{t('partilha.manter_aberta')}</p>
    </div>
  );
}
