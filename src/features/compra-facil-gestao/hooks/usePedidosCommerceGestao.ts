import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { mensagemDeErro } from '@/shared/utils';
import { pedidosCommerceGestaoApi } from '../api/pedidos-commerce-gestao.api';
import type {
  CancelarPedidoPayload,
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
  const { t } = useTranslation('lojaGestao');
  const invalidar = useInvalidarPedidosCommerce();
  return useMutation({
    mutationFn: (id: string) => pedidosCommerceGestaoApi.confirmar(id),
    onSuccess: () => {
      toast.success(t('mensagens.confirmado'));
      invalidar();
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_confirmar'))),
  });
}

/**
 * A única saída para um pedido que já passou de CONFIRMADO — o cliente só cancela
 * até aí, e a expiração automática só apanha os que ninguém confirmou. Sem isto, um
 * pedido abandonado em preparação segurava a reserva de stock indefinidamente.
 */
export function useCancelarPedidoCommerce() {
  const { t } = useTranslation('lojaGestao');
  const invalidar = useInvalidarPedidosCommerce();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CancelarPedidoPayload }) =>
      pedidosCommerceGestaoApi.cancelar(id, payload),
    onSuccess: () => {
      toast.success(t('mensagens.cancelado'));
      invalidar();
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_cancelar'))),
  });
}

export function useIniciarPreparacaoCommerce() {
  const { t } = useTranslation('lojaGestao');
  const invalidar = useInvalidarPedidosCommerce();
  return useMutation({
    mutationFn: (id: string) => pedidosCommerceGestaoApi.iniciarPreparacao(id),
    onSuccess: () => {
      toast.success(t('mensagens.preparacao_iniciada'));
      invalidar();
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_iniciar_preparacao'))),
  });
}

export function useConferirPedidoCommerce() {
  const { t } = useTranslation('lojaGestao');
  const invalidar = useInvalidarPedidosCommerce();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ConferirPedidoPayload }) =>
      pedidosCommerceGestaoApi.conferir(id, payload),
    onSuccess: () => {
      toast.success(t('mensagens.conferencia_fechada'));
      invalidar();
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_conferir'))),
  });
}

export function useSubstituirItemCommerce() {
  const { t } = useTranslation('lojaGestao');
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
      toast.success(t('mensagens.substituicao_registada'));
      invalidar();
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_substituir'))),
  });
}

export function useConfirmarLevantamentoCommerce() {
  const { t } = useTranslation('lojaGestao');
  const invalidar = useInvalidarPedidosCommerce();
  return useMutation({
    mutationFn: (id: string) => pedidosCommerceGestaoApi.confirmarLevantamento(id),
    onSuccess: () => {
      toast.success(t('mensagens.levantamento_confirmado'));
      invalidar();
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_confirmar_levantamento'))),
  });
}

/**
 * Despachar: sai o stock e nasce a venda, por isso o erro do servidor (caixa fechado, caixa
 * noutra loja, pedido já despachado por outra pessoa) chega ao ecrã com a causa, e não uma
 * frase genérica.
 */
export function useExpedirPedidoCommerce() {
  const { t } = useTranslation('lojaGestao');
  const invalidar = useInvalidarPedidosCommerce();
  return useMutation({
    mutationFn: (id: string) => pedidosCommerceGestaoApi.expedir(id),
    onSuccess: () => {
      toast.success(t('mensagens.despachado'));
      invalidar();
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_despachar'))),
  });
}
