import { useTranslation } from 'react-i18next';
import { LocateFixed, LocateOff, MapPin, TriangleAlert } from 'lucide-react';
import type { EstadoDaPartilha } from '../hooks/useEmitirPosicao';

/**
 * O aviso **permanente** da partilha de posição (plano §4.6, D7). Fica no topo de todos os ecrãs da
 * aplicação enquanto houver uma entrega em rota **ou o estafeta estiver online** (plano §4.9) — ele tem de saber,
 * a cada momento, se está a ser localizado, por quem, e o que fazer para que funcione.
 *
 * É só apresentação: o estado vem de quem chamou `useEmitirPosicao` (o `EstafetaLayout`), que também precisa do
 * canal para escutar as ofertas — um só canal, e não dois a partilharem o GPS.
 *
 * A mensagem sobre o segundo plano é a limitação real de uma PWA: com o ecrã apagado ou outra
 * aplicação à frente, o navegador pára a localização. Escondê-la deixaria o cliente a ver «sem posição
 * recente» sem o estafeta perceber porquê.
 */
export function PartilhaDePosicao({
  estado,
  consentir,
  modo,
}: {
  estado: EstadoDaPartilha;
  consentir: () => void;
  /** Em rota (o cliente vê a posição) ou só online (ninguém a vê: serve para escolher quem está perto da loja). */
  modo: 'rota' | 'online';
}) {
  const { t } = useTranslation('estafeta');
  // O texto muda com o modo: «só durante uma entrega» seria falso para quem está online.
  const p = modo === 'online' ? 'partilha_online' : 'partilha';

  if (estado === 'inactiva') return null;

  if (estado === 'precisa_consentimento') {
    return (
      <section className="mx-4 mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-4" role="alertdialog" aria-labelledby="partilha-titulo">
        <h2 id="partilha-titulo" className="flex items-center gap-2 text-sm font-bold text-blue-900">
          <MapPin size={16} />
          {t(`${p}.consentimento_titulo`)}
        </h2>
        <p className="mt-2 text-sm text-blue-900">{t(`${p}.consentimento_texto`)}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-blue-900">
          <li>{t(`${p}.consentimento_so_em_rota`)}</li>
          <li>{t(`${p}.consentimento_quem_ve`)}</li>
          <li>{t(`${p}.consentimento_sem_historico`)}</li>
        </ul>
        <button
          type="button"
          onClick={consentir}
          className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white active:bg-blue-700"
        >
          {t(`${p}.consentimento_aceitar`)}
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
        {t(`${p}.negada`)}
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
        {aPartilhar ? t(`${p}.a_partilhar`) : t(`${p}.sem_canal`)}
      </p>
      <p className="mt-1 text-xs opacity-90">{t('partilha.manter_aberta')}</p>
    </div>
  );
}
