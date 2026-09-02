import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { alertasApi, type TipoAlerta } from '../api/alertas.api';

export function useAlertas(filtros?: { porLer?: boolean; tipo?: TipoAlerta; limite?: number }) {
  return useQuery({
    queryKey: ['alertas', filtros],
    queryFn: () => alertasApi.listar(filtros),
  });
}

/**
 * O número no sino.
 *
 * ## Porquê um intervalo, com socket a funcionar
 *
 * O socket empurra os alertas novos, e é isso que faz o sino acender no momento. Mas uma
 * ligação cai sem avisar — rede móvel, portátil fechado, servidor reiniciado — e o socket
 * volta sem trazer o que aconteceu enquanto esteve fora.
 *
 * Dois minutos é a rede de segurança: raro o suficiente para não custar nada, frequente o
 * suficiente para um alerta não passar uma manhã inteira sem aparecer.
 */
export function useContagemAlertas() {
  return useQuery({
    queryKey: ['alertas', 'contagem'],
    queryFn: () => alertasApi.contar(),
    refetchInterval: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Liga os alertas ao socket que já existe.
 *
 * Invalida em vez de acrescentar à lista em memória: o servidor decide a ordem — críticos
 * primeiro — e um alerta inserido no topo pelo cliente apareceria no sítio errado até ao
 * próximo carregamento.
 */
export function useAlertasEmTempoReal(socket: Socket | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const actualizar = () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
    };

    socket.on('alerta.novo', actualizar);
    socket.on('alerta.resolvido', actualizar);

    return () => {
      socket.off('alerta.novo', actualizar);
      socket.off('alerta.resolvido', actualizar);
    };
  }, [socket, queryClient]);
}

export function useAlertaMutations() {
  const queryClient = useQueryClient();

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['alertas'] });

  const marcarLido = useMutation({
    mutationFn: (id: string) => alertasApi.marcarLido(id),
    onSuccess: invalidar,
  });

  const marcarTodos = useMutation({
    mutationFn: () => alertasApi.marcarTodos(),
    onSuccess: invalidar,
  });

  return { marcarLido, marcarTodos };
}
