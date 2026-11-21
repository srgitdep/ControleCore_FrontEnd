import { api } from '@/shared/config';

export interface RegistarPedidoClienteDto {
  nomeProduto: string;
  sessaoId: string;
  clienteId?: string;
}

export interface RankingPedidoCliente {
  nomeProduto: string;
  totalPedidos: number;
  ultimoPedidoEm: string;
}

export const registarPedidoCliente = async (payload: RegistarPedidoClienteDto) => {
  const { data } = await api.post('/pedidos-cliente', payload);
  return data;
};

export const getRankingPedidosCliente = async (lojaId?: string) => {
  const { data } = await api.get<RankingPedidoCliente[]>('/pedidos-cliente/ranking', {
    params: lojaId ? { lojaId } : undefined,
  });
  return data;
};
