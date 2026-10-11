import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, MapPin, Radio } from 'lucide-react';
import { cn } from '@/shared/utils';
import { posicaoRecente } from '@/shared/utils/rastreio';
import { MapaEntregaLazy } from '@/shared/ui/mapa/MapaEntregaLazy';
import type { EstafetaNoMapa } from '@/shared/ui/mapa/MapaEntrega';
import { usePosicoesDosEstafetas } from '../hooks/usePosicoesDosEstafetas';
import type { EntregaPainel } from '../types/operacao';

/** Instante que avança sozinho: uma posição que envelhece tem de passar a esbatida sem esperar por um evento. */
function useAgora(intervaloMs: number) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);
  return agora;
}

/**
 * Os estafetas em rota num mapa, no painel de entregas (plano §4.6).
 *
 * Só aparece se há entregas `EM_ROTA` na lista que o painel já tem — sem ninguém na rua, o mapa seria
 * um quadrado vazio a ocupar o ecrã. Mostra quem está em rota (do painel) e onde (do canal): um estafeta
 * em rota sem posição aparece na lista como «a aguardar posição», nunca num ponto inventado.
 */
export function MapaDosEstafetas({ entregas }: { entregas: EntregaPainel[] }) {
  const { t } = useTranslation('entrega');
  const [aberto, setAberto] = useState(true);
  const agora = useAgora(15_000);

  const emRota = useMemo(() => {
    const porEstafeta = new Map<string, { id: string; nome: string; entregas: number }>();
    for (const e of entregas) {
      if (e.estado !== 'EM_ROTA' || !e.estafeta) continue;
      const actual = porEstafeta.get(e.estafeta.id);
      porEstafeta.set(e.estafeta.id, {
        id: e.estafeta.id,
        nome: e.estafeta.nome,
        entregas: (actual?.entregas ?? 0) + 1,
      });
    }
    return [...porEstafeta.values()];
  }, [entregas]);

  const { posicoes, aoVivo } = usePosicoesDosEstafetas(emRota.length > 0);

  if (emRota.length === 0) return null;

  const noMapa: EstafetaNoMapa[] = emRota.flatMap((e) => {
    const p = posicoes[e.id];
    return p
      ? [{ id: e.id, nome: e.nome, latitude: p.latitude, longitude: p.longitude, desactualizada: !posicaoRecente(p.em, agora) }]
      : [];
  });
  const aAguardar = emRota.filter((e) => !posicoes[e.id]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <MapPin size={16} className="text-sky-600" />
          {t('rastreio.titulo', { count: emRota.length })}
        </h2>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
              aoVivo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500',
            )}
          >
            <Radio size={11} className={cn(aoVivo && 'animate-pulse')} />
            {aoVivo ? t('rastreio.ao_vivo') : t('rastreio.sem_tempo_real')}
          </span>
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-label={aberto ? t('rastreio.esconder') : t('rastreio.mostrar')}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          >
            {aberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {aberto && (
        <>
          {noMapa.length > 0 ? (
            <MapaEntregaLazy marcador={null} estafetas={noMapa} className="mt-3 h-72 w-full rounded-xl" />
          ) : (
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
              {aoVivo ? t('rastreio.a_aguardar') : t('rastreio.sem_canal')}
            </p>
          )}

          {aAguardar.length > 0 && noMapa.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              {t('rastreio.sem_posicao_de', { nomes: aAguardar.map((e) => e.nome).join(', ') })}
            </p>
          )}
          {noMapa.some((e) => e.desactualizada) && (
            <p className="mt-1 text-xs text-slate-400">{t('rastreio.esbatido')}</p>
          )}
        </>
      )}
    </section>
  );
}
