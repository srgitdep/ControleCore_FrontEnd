import { api } from './axios';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── API Functions ────────────────────────────────────────────────────────────

export const processarVenda = async (payload: ProcessarVendaDto) => {
  const { data } = await api.post('/vendas/processar', payload);
  return data;
};

export const enviarRecibo = async (vendaId: string, email: string) => {
  const { data } = await api.post('/vendas/enviar-recibo', { vendaId, email });
  return data;
};
