import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { enderecoDoSocket } from '../config/enderecoSocket';

/**
 * O endereço do WebSocket vem de `enderecoDoSocket()`, partilhado com o hook da voz.
 *
 * Este ficheiro tinha uma cópia própria da regra. A da voz tinha outra, mais antiga,
 * que ignorava `VITE_SOCKET_URL` — e foi por aí que a voz da Mayra deixou de ligar em
 * produção. Com a decisão num sítio só, as duas não podem voltar a divergir.
 */
const SOCKET_URL = enderecoDoSocket().endereco;

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
