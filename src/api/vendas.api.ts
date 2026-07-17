import { api } from './axios';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface VendaItemDto {
  produtoId: string;
  quantidade: number;
  desconto?: number;
}

export type MetodoPagamento = 'NUMERARIO' | 'CARTAO' | 'MPESA' | 'EMOLA';

export interface PagamentoVendaDto {
  metodo: MetodoPagamento;
  valorEntregue: number;
}

export interface ProcessarVendaDto {
  itens: VendaItemDto[];
  // O backend aceita array de pagamentos (split payment)
  pagamentos: PagamentoVendaDto[];
  clienteId?: string;
  emailCliente?: string;
}

// â”€â”€â”€ API Functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const processarVenda = async (payload: ProcessarVendaDto) => {
  const { data } = await api.post('/vendas/processar', payload);
  return data;
};

export const enviarRecibo = async (vendaId: string, email: string) => {
  const { data } = await api.post('/vendas/enviar-recibo', { vendaId, email });
  return data;
};
