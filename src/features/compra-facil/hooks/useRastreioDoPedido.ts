import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCanalDeEntregas } from '@/shared/hooks/useCanalDeEntregas';
import { acrescentarAoRasto, type Ponto } from '@/shared/utils/rastreio';
import { contaApi as contaApiDoCliente } from '../api/conta.api';
import { pedidos } from '../api/pedidos.api';
import type { EntregaDoPedido, EstadoPedido } from '../api/pedidos.api';

const CHAVE = 'loja';
/** Sem canal em tempo real a posição vem por consulta, ao mesmo ritmo a que o estafeta a envia (2,5 s): o cliente não nota a diferença entre «ao vivo» e o recurso. */
const RECURSO_SEM_CANAL_MS = 2_500;
/** Ao vivo, a posição vem pelo canal; refaz-se a entrega de minuto a minuto só para renovar o tempo estimado (o servidor guarda-o um minuto). */
const UM_MINUTO = 60_000;

/** Só nestes estados a mercadoria já saiu da loja e há algo a seguir ao vivo. */
const ESTADOS_AO_VIVO: readonly EstadoPedido[] = ['EXPEDIDO', 'EM_ROTA'];

interface PosicaoDoSocket {
  entregaId: string;
  pedidoId: string;
  latitude: number;
  longitude: number;
  em: string;
}

interface EstadoDoSocket {
  pedidoId: string;
}

/**
 * Acompanha a entrega de um pedido (plano §4.6): a entrega vem por REST; a posição nova chega pelo
 * canal `/entregas`, e **se o canal não ligar, a consulta passa a 30 s** — o cliente nunca fica sem
 * saber, só com menos frescura. `aoVivo` diz qual dos dois está a valer.
 *
 * ## Quem escolhe a sala
 *
 * O cliente nunca escolhe: pede `seguir` com o id do pedido e o servidor confirma que é da sua conta.
 * Pedir de novo a cada (re)ligação é obrigatório — a sala perde-se com a ligação.
 *
 * ## O rasto
 *
 * Guarda-se só em memória, nesta página (D3): sem rasto no servidor, o que se vê é o que chegou desde
 * que a página abriu. Ao abrir a meio da rota o rasto começa na posição actual.
 */
export function useRastreioDoPedido(pedidoId: string | undefined, estado: EstadoPedido | undefined, eEntrega: boolean) {
  const queryClient = useQueryClient();
  const chave = [CHAVE, 'pedidos', pedidoId, 'entrega'] as const;
  const [rasto, setRasto] = useState<Ponto[]>([]);

  // Entregue ou falhada já não há nada a seguir: o estado do pedido e a linha do tempo bastam.
  const aoVivoPossivel = eEntrega && !!estado && ESTADOS_AO_VIVO.includes(estado);
  const temEntrega = aoVivoPossivel;

  const aoLigar = useCallback(
    (socket: { emit: (evento: string, dados: unknown) => void }) => {
      if (pedidoId) socket.emit('seguir', { pedidoId });
    },
    [pedidoId],
  );

  const { ligado } = useCanalDeEntregas({
    activo: aoVivoPossivel && !!pedidoId,
    obterToken: () => contaApiDoCliente.get<{ token: string }>('/commerce/conta/socket-token').then((r) => r.data.token),
    aoLigar,
    eventos: {
      'entrega.posicao': ((dados: PosicaoDoSocket) => {
        if (dados.pedidoId !== pedidoId) return;
        queryClient.setQueryData<EntregaDoPedido | null>(chave, (anterior) =>
          anterior
            ? {
                ...anterior,
                posicao: { latitude: dados.latitude, longitude: dados.longitude, em: dados.em },
                posicaoDesactualizada: false,
              }
            : anterior,
        );
        setRasto((r) => acrescentarAoRasto(r, dados));
      }) as (d: never) => void,
      // Uma mudança de estado muda a linha do tempo e o próprio pedido: refaz-se tudo.
      'entrega.estado': ((dados: EstadoDoSocket) => {
        if (dados.pedidoId !== pedidoId) return;
        void queryClient.invalidateQueries({ queryKey: [CHAVE, 'pedidos', pedidoId] });
      }) as (d: never) => void,
    },
  });

  const consulta = useQuery({
    queryKey: chave,
    queryFn: () => pedidos.entrega(pedidoId!),
    enabled: !!pedidoId && temEntrega,
    // Sem canal: 2,5 s. Com canal: 1 min, só para o tempo estimado; a posição chega pelo socket.
    refetchInterval: aoVivoPossivel ? (ligado ? UM_MINUTO : RECURSO_SEM_CANAL_MS) : false,
  });

  // A posição que veio por REST (ao abrir a página, ou no recurso de 30 s) também entra no rasto.
  const posicao = consulta.data?.posicao;
  useEffect(() => {
    if (posicao) setRasto((r) => acrescentarAoRasto(r, posicao));
  }, [posicao?.latitude, posicao?.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    entrega: consulta.data ?? null,
    isLoading: consulta.isLoading,
    isError: consulta.isError,
    refazer: () => void consulta.refetch(),
    /** Verdadeiro só se o canal está ligado agora; falso = a actualizar de 30 em 30 segundos. */
    aoVivo: aoVivoPossivel && ligado,
    rasto,
    temEntrega,
  };
}
