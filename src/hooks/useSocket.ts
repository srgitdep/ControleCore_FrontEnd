import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const BASE_URL = import.meta.env.VITE_API_URL as string;

// Remove /api if present to get the base domain for WebSockets
const SOCKET_URL = BASE_URL.replace('/api', '');

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) return;

    const socketInstance = io(SOCKET_URL, {
      extraHeaders: {
        Authorization: `Bearer ${token}`
      },
      // auth: { token } -> Muito comum no NestJS Gateways
      auth: {
        token: token
      }
    });

    socketInstance.on('connect', () => {
      console.log('[WebSockets] Connected:', socketInstance.id);
    });

    // Evento de atualizaÃ§Ã£o de stock (Ledger)
    socketInstance.on('stock_updated', (data) => {
      // Invalida a query de produtos para buscar as quantidades atualizadas no POS
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // Invalida a query de stocks para atualizar as tabelas do dashboard de gestÃ£o
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      
      // Se houver necessidade de invalidar um produto em especÃ­fico
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
