import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { mensagemDeErro } from '@/shared/utils';
import { pedidosCommerceGestaoApi } from '../api/pedidos-commerce-gestao.api';
import type {
  ConferirPedidoPayload,
  FiltrosPedidoCommerce,
  SubstituirItemPayload,
} from '../types/pedido-commerce-gestao.types';

const CHAVE = 'commerce-pedidos-gestao';
const TRINTA_SEGUNDOS = 30 * 1000;

/**
 * A fila de pedidos — actualiza sozinha a cada 30s, para um pedido novo do
 * cliente aparecer sem alguém ter de recarregar a página manualmente.
 */
export function usePedidosCommerceGestao(filtros?: FiltrosPedidoCommerce) {
  return useQuery({
    queryKey: [CHAVE, 'lista', filtros],
    queryFn: () => pedidosCommerceGestaoApi.listar(filtros),
    refetchInterval: TRINTA_SEGUNDOS,
    placeholderData: (prev) => prev,
  });
}

function useInvalidarPedidosCommerce() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [CHAVE] });
}

export function useConfirmarPedidoCommerce() {
  const invalidar = useInvalidarPedidosCommerce();
  return useMutation({
    mutationFn: (id: string) => pedidosCommerceGestaoApi.confirmar(id),
    onSuccess: () => {
      toast.success('Pedido confirmado.');
      invalidar();
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, 'Não foi possível confirmar o pedido.')),
  });
}

export function useIniciarPreparacaoCommerce() {
  const invalidar = useInvalidarPedidosCommerce();
  return useMutation({
    mutationFn: (id: string) => pedidosCommerceGestaoApi.iniciarPreparacao(id),
    onSuccess: () => {
      toast.success('Preparação iniciada.');
      invalidar();
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, 'Não foi possível iniciar a preparação.')),
  });
}

export function useConferirPedidoCommerce() {
  const invalidar = useInvalidarPedidosCommerce();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ConferirPedidoPayload }) =>
      pedidosCommerceGestaoApi.conferir(id, payload),
    onSuccess: () => {
      toast.success('Conferência fechada — pedido pronto para levantamento.');
      invalidar();
    },
    onError: (erro) =>
      toast.error(
        mensagemDeErro(
          erro,
          'Ainda há artigos por resolver — confirme a quantidade ou registe uma substituição.',
        ),
      ),
  });
}

export function useSubstituirItemCommerce() {
  const invalidar = useInvalidarPedidosCommerce();
  return useMutation({
    mutationFn: ({
      id,
      itemId,
      payload,
    }: {
      id: string;
      itemId: string;
      payload: SubstituirItemPayload;
    }) => pedidosCommerceGestaoApi.substituirItem(id, itemId, payload),
    onSuccess: () => {
      toast.success('Substituição registada.');
      invalidar();
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, 'Não foi possível registar a substituição.')),
  });
}

export function useConfirmarLevantamentoCommerce() {
  const invalidar = useInvalidarPedidosCommerce();
  return useMutation({
    mutationFn: (id: string) => pedidosCommerceGestaoApi.confirmarLevantamento(id),
    onSuccess: () => {
      toast.success('Levantamento confirmado — venda criada.');
      invalidar();
    },
    onError: (erro) =>
      toast.error(
        mensagemDeErro(
          erro,
          'Não foi possível confirmar o levantamento — verifique se tem uma sessão de caixa aberta.',
        ),
      ),
  });
}
