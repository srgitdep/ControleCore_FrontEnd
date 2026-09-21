import { api } from '@/shared/config';
import type {
  ConferirPedidoPayload,
  FiltrosPedidoCommerce,
  PedidoCommerceGestao,
  SubstituirItemPayload,
} from '../types/pedido-commerce-gestao.types';

const BASE = '/commerce/gestao/pedidos';

/**
 * A instância `api` partilhada, autenticada por cookie de funcionário — nunca
 * `contaApi` (exclusiva do lado do cliente final do Compra Fácil).
 */
export const pedidosCommerceGestaoApi = {
  listar: async (filtros?: FiltrosPedidoCommerce) => {
    const { data } = await api.get<PedidoCommerceGestao[]>(BASE, { params: filtros });
    return data;
  },

  confirmar: async (id: string) => {
    const { data } = await api.patch<PedidoCommerceGestao>(`${BASE}/${id}/confirmar`);
    return data;
  },

  iniciarPreparacao: async (id: string) => {
    const { data } = await api.patch<{
      pedido: PedidoCommerceGestao;
      sequenciaPicking: PedidoCommerceGestao['itens'];
    }>(`${BASE}/${id}/iniciar-preparacao`);
    return data;
  },

  conferir: async (id: string, payload: ConferirPedidoPayload) => {
    const { data } = await api.patch<PedidoCommerceGestao>(`${BASE}/${id}/conferencia`, payload);
    return data;
  },

  substituirItem: async (id: string, itemId: string, payload: SubstituirItemPayload) => {
    const { data } = await api.post(`${BASE}/${id}/itens/${itemId}/substituir`, payload);
    return data;
  },

  confirmarLevantamento: async (id: string) => {
    const { data } = await api.post<PedidoCommerceGestao>(`${BASE}/${id}/confirmar-levantamento`);
    return data;
  },
};
