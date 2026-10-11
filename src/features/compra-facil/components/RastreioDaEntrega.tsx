import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Loader2, MapPinOff, Radio, RefreshCw } from 'lucide-react';
import { cn } from '@/shared/utils';
import { distanciaMetros, posicaoRecente, textoDeDistancia } from '@/shared/utils/rastreio';
import { MapaEntregaLazy } from '@/shared/ui/mapa/MapaEntregaLazy';
import { useRastreioDoPedido } from '../hooks/useRastreioDoPedido';
import type { EstadoPedido } from '../api/pedidos.api';

/** Uma «hora» que avança sozinha: sem ela, uma posição que envelhece continuava a parecer fresca até ao próximo evento. */
function useAgora(intervaloMs: number) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);
  return agora;
}

interface Props {
  pedidoId: string;
  estado: EstadoPedido;
  eEntrega: boolean;
}

/**
 * O cliente a seguir a sua entrega (plano §4.6). Mostra, por esta ordem de verdade:
 * - **a caminho com posição recente:** o mapa com o estafeta, o rasto, o destino e a distância em linha
 *   recta. Não há «tempo estimado» sem um serviço de rotas (5C): sem serviço, sem número;
 * - **a caminho sem posição recente:** diz-o, e não mostra um pino parado a fingir que é ao vivo;
 * - **despachado e ainda na loja:** o destino, sem estafeta no mapa.
 */
export function RastreioDaEntrega({ pedidoId, estado, eEntrega }: Props) {
  const { t } = useTranslation('loja');
  const agora = useAgora(15_000);
  const { entrega, isLoading, isError, refazer, aoVivo, rasto, temEntrega } = useRastreioDoPedido(pedidoId, estado, eEntrega);

  if (!temEntrega) return null;

  if (isLoading) {
    return (
      <div className="mt-4 flex h-24 items-center justify-center rounded-xl bg-slate-50">
        <Loader2 size={18} className="animate-spin text-slate-300" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700">
        <AlertTriangle size={14} className="shrink-0" />
        {t('rastreio.erro')}
        <button type="button" onClick={refazer} className="font-semibold underline">
          {t('rastreio.repetir')}
        </button>
      </div>
    );
  }

  // Pedido de entrega ainda sem entrega criada: nada a mostrar além da linha do tempo.
  if (!entrega) return null;

  // O mapa só interessa enquanto a mercadoria vai a caminho; depois de entregue ou falhada fica a linha do tempo.
  const aCaminho = entrega.estado === 'EM_ROTA';
  if (!aCaminho && entrega.estado !== 'RECOLHIDA' && entrega.estado !== 'ATRIBUIDA' && entrega.estado !== 'AGUARDA_RECOLHA') return null;

  const posicao = entrega.posicao;
  const recente = !!posicao && posicaoRecente(posicao.em, agora);
  const destino = { latitude: entrega.destino.latitude, longitude: entrega.destino.longitude };
  const loja =
    entrega.loja.latitude !== null && entrega.loja.longitude !== null
      ? { latitude: entrega.loja.latitude, longitude: entrega.loja.longitude }
      : null;
  const estafeta = aCaminho && posicao && recente ? { latitude: posicao.latitude, longitude: posicao.longitude } : null;
  const distancia = estafeta ? textoDeDistancia(distanciaMetros(estafeta, destino)) : '';
  // Só se mostra quando o servidor a deu: sem serviço de rotas não há número, nem se calcula um a olho aqui.
  const previsao = estafeta ? entrega.previsao : null;
  const nome = entrega.estafeta?.primeiroNome;

  return (
    <section className="mt-4 border-t border-slate-100 pt-4" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900">
            {aCaminho
              ? nome
                ? t('rastreio.a_caminho_nome', { nome })
                : t('rastreio.a_caminho')
              : t('rastreio.preparar')}
          </h2>
          {previsao && (
            <p className="mt-0.5 text-sm font-semibold text-emerald-700">
              {t('rastreio.faltam_minutos', { count: previsao.minutos })}
            </p>
          )}
          {aCaminho && estafeta && distancia && (
            <p className="mt-0.5 text-xs text-slate-500">
              {previsao ? t('rastreio.distancia_estrada', { distancia: textoDeDistancia(previsao.distanciaMetros) }) : t('rastreio.distancia', { distancia })}
            </p>
          )}
        </div>

        {aCaminho && (
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
              aoVivo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500',
            )}
          >
            <Radio size={11} className={cn(aoVivo && 'animate-pulse')} />
            {aoVivo ? t('rastreio.ao_vivo') : t('rastreio.a_cada_2_5s')}
          </span>
        )}
      </div>

      {aCaminho && !estafeta && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <MapPinOff size={14} className="shrink-0" />
          {t('rastreio.sem_posicao_recente')}
        </p>
      )}

      <MapaEntregaLazy
        marcador={destino}
        loja={loja}
        estafeta={estafeta}
        rasto={estafeta ? rasto : undefined}
        rotaPrevista={previsao?.caminho}
        className="mt-3 h-64 w-full rounded-xl"
      />

      <p className="mt-2 text-xs text-slate-400">{entrega.destino.morada}</p>

      {aCaminho && (
        <button
          type="button"
          onClick={refazer}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          <RefreshCw size={12} />
          {t('rastreio.actualizar')}
        </button>
      )}
    </section>
  );
}
