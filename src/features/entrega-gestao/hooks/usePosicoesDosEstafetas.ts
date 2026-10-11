import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCanalDeEntregas } from '@/shared/hooks/useCanalDeEntregas';
import { operacaoApi } from '../api/operacao.api';

/** Tem de ser a chave-raiz de `useOperacao` para que invalidar aqui refaça o painel. */
const CHAVE_OPERACAO = 'entrega-operacao';

export interface PosicaoDoEstafeta {
  latitude: number;
  longitude: number;
  /** ISO, tal como o servidor enviou. */
  em: string;
}

interface PosicaoDoSocket extends PosicaoDoEstafeta {
  estafetaId: string;
}

/**
 * A posição de cada estafeta em rota, para o mapa do painel (plano §4.6).
 *
 * Só há posições **desde que o painel abriu**: o servidor guarda a última, mas o painel de entregas não
 * a pede por REST — um estafeta que já está em rota aparece no mapa na primeira leitura dele (≤ 1 min),
 * e o mapa diz «a aguardar posição» até lá.
 *
 * Aproveita-se o canal também para o painel: uma mudança de estado refaz as colunas **na hora**, em vez
 * de esperar pela consulta de 30 s. Sem canal, a consulta de 30 s do painel continua a valer.
 */
export function usePosicoesDosEstafetas(activo: boolean) {
  const queryClient = useQueryClient();
  const [posicoes, setPosicoes] = useState<Record<string, PosicaoDoEstafeta>>({});

  const { ligado } = useCanalDeEntregas({
    activo,
    obterToken: () => operacaoApi.tokenDeSocket(),
    eventos: {
      'entrega.posicao': ((dados: PosicaoDoSocket) => {
        setPosicoes((anteriores) => ({
          ...anteriores,
          [dados.estafetaId]: { latitude: dados.latitude, longitude: dados.longitude, em: dados.em },
        }));
      }) as (d: never) => void,
      'entrega.estado': (() => {
        void queryClient.invalidateQueries({ queryKey: [CHAVE_OPERACAO] });
      }) as (d: never) => void,
    },
  });

  return { posicoes, aoVivo: ligado };
}
