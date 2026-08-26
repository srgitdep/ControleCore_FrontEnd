import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { enderecoDoSocket } from '../config/enderecoSocket';
import { api } from '../config';

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
    // Uma ligação abandonada: o efeito pode ser desmontado enquanto o token ainda vem
    // a caminho, e nesse caso não se deve abrir socket nenhum.
    let cancelado = false;
    let socketInstance: Socket | null = null;

    // O cookie não chega ao gateway. A página é servida pela Vercel e a API vive no
    // Fly, e os `rewrites` da Vercel não encaminham WebSockets: o socket liga
    // directamente ao Fly, para onde os cookies do domínio da Vercel — que são de
    // outro sítio — não seguem. O handshake chegava vazio e era recusado com
    // «No cookies found», deixando as actualizações de stock no POS caladas sem erro
    // visível.
    //
    // Este pedido, sendo REST, passa pelo encaminhamento e leva o cookie. O token que
    // devolve vale 15 minutos e serve só para abrir a ligação. É o mesmo caminho que a
    // voz da Mayra já usava.
    const ligar = async () => {
      let token: string | undefined;
      try {
        const resposta = await api.get('/auth/socket-token');
        token = resposta.data?.token;
      } catch (e) {
        // Em desenvolvimento a página e a API partilham origem e o cookie chega bem,
        // pelo que vale a pena tentar ligar mesmo sem token.
        console.warn('[WebSockets] Não foi possível obter o token; a tentar pelo cookie.', e);
      }

      if (cancelado) return;

      socketInstance = io(SOCKET_URL, {
        auth: { token },
        withCredentials: true,
      });
      registarEventos(socketInstance);
      setSocket(socketInstance);
    };

    const registarEventos = (socketInstance: Socket) => {
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

    };

    void ligar();

    return () => {
      cancelado = true;
      socketInstance?.disconnect();
    };
  }, [queryClient]);

  return socket;
}
