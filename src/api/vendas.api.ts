import { api } from './axios';

export interface VendaItemDto {
  produtoId: string;
  quantidade: number;
  desconto?: number;
}

export interface PagamentoVendaDto {
  metodo: 'NUMERARIO' | 'CARTAO' | 'MPESA' | 'EMOLA';
  valorEntregue: number;
}

export interface ProcessarVendaDto {
  itens: VendaItemDto[];
  pagamento: PagamentoVendaDto;
  clienteId?: string;
  emailCliente?: string;
}

export const processarVenda = async (payload: ProcessarVendaDto) => {
  const { data } = await api.post('/vendas/processar', payload);
  return data;
};

export const enviarRecibo = async (vendaId: string, email: string) => {
  const { data } = await api.post('/vendas/enviar-recibo', { vendaId, email });
  return data;
};
