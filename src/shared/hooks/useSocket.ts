import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * O endereço do WebSocket.
 *
 * `VITE_API_URL` é opcional em desenvolvimento — sem ela, o endereço da API é deduzido do
 * anfitrião que serve a página. Este ficheiro assumia que existia sempre e fazia
 * `BASE_URL.replace(...)` no topo do módulo: com a variável ausente, o `replace` corria
 * sobre `undefined` e lançava ao **importar** o módulo, antes de qualquer render. A
 * aplicação inteira ficava em branco, sem nada no ecrã que indicasse a causa.
 *
 * Deduz-se da mesma forma que em `axios.ts`, e o `/api` sai do fim para sobrar o domínio,
 * que é o que o Socket.io quer.
 */
function resolverEnderecoDoSocket(): string {
  const configurado = import.meta.env.VITE_API_URL as string | undefined;

  if (configurado) {
    // Um caminho relativo (`/api/v1`, usado quando os pedidos REST passam pelo
    // encaminhamento do Vercel) não serve para o Socket.io, que precisa de um endereço
    // absoluto. Nesse caso vale a origem da página.
    //
    // Nota: ao contrário dos pedidos REST, o WebSocket **não** deve ser reduzido a
    // caminho relativo em produção. Os rewrites do Vercel não encaminham WebSockets, e
    // a ligação teria de falhar para depois cair no `polling` sobre HTTP. O
    // `VITE_SOCKET_URL` existe para esse caso: dá o endereço directo da API quando os
    // pedidos REST vão por caminho relativo.
    const socketDirecto = import.meta.env.VITE_SOCKET_URL as string | undefined;
    if (socketDirecto) return socketDirecto;

    if (configurado.startsWith('/')) {
      return typeof window === 'undefined' ? '' : window.location.origin;
    }
    return configurado.replace('/api', '');
  }

  if (typeof window === 'undefined') return '';

  const { protocol, hostname } = window.location;
  const porta = (import.meta.env.VITE_API_PORT as string | undefined) ?? '3100';
  return `${protocol}//${hostname}:${porta}`;
}

const SOCKET_URL = resolverEnderecoDoSocket();

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Sem token lido daqui: o `accessToken` é um cookie HttpOnly desde a migração que
    // o retirou do `localStorage` (era alcançável por XSS). Este ficheiro continuou a
    // fazer `localStorage.getItem('accessToken')` e a desistir quando vinha `null` —
    // ou seja, o WebSocket nunca chegava a ligar-se, em nenhuma plataforma, e as
    // actualizações de stock em tempo real no POS estavam caladas sem dar erro.
    //
    // O gateway lê o token do cookie do handshake (`client.handshake.headers.cookie`),
    // pelo que basta pedir ao Socket.io que envie as credenciais.
    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
    });

    socketInstance.on('connect', () => {
      console.log('[WebSockets] Connected:', socketInstance.id);
    });

    // Evento de atualização de stock (Ledger)
    socketInstance.on('stock_updated', (data) => {
      // Invalida a query de produtos para buscar as quantidades atualizadas no POS
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // Invalida a query de stocks para atualizar as tabelas do dashboard de gestão
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      
      // Se houver necessidade de invalidar um produto em específico
      if (data?.productId) {
        queryClient.invalidateQueries({ queryKey: ['stock', data.productId] });
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('[WebSockets] Disconnected');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [queryClient]);

  return socket;
}
