import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { mensagemDeErro } from '@/shared/utils';
import { pedidos } from '../api/pedidos.api';
import type { MetodoPagamentoCommerce } from '../api/pedidos.api';

const CHAVE = 'loja';

export function useMeusPedidos() {
  return useQuery({
    queryKey: [CHAVE, 'pedidos'],
    queryFn: () => pedidos.listar(),
  });
}

export function usePedido(id: string | undefined) {
  return useQuery({
    queryKey: [CHAVE, 'pedidos', id],
    queryFn: () => pedidos.obter(id!),
    enabled: !!id,
    // Polling simples em vez de WebSocket — o gateway de tempo real já existe mas está
    // subutilizado, e para um cliente a acompanhar um pedido, 15s de atraso não importa.
    refetchInterval: 15_000,
  });
}

export function useCriarPedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      lojaId: string;
      itens: { produtoId: string; quantidade: number }[];
      metodoPagamento: MetodoPagamentoCommerce;
    }) => pedidos.criar(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [CHAVE, 'pedidos'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, 'Não foi possível criar o pedido.')),
  });
}

export function useCancelarPedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pedidos.cancelar(id),
    onSuccess: () => {
      toast.success('Pedido cancelado.');
      void queryClient.invalidateQueries({ queryKey: [CHAVE, 'pedidos'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, 'Não foi possível cancelar o pedido.')),
  });
}
