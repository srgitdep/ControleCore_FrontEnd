import { api } from '@/shared/config';

// ──â”€ Types ────────────────────────────────────────────────────────────────────

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
  // Desconto aplicado ao total da venda, para além dos descontos por linha
  descontoGlobal?: number;
  clienteId?: string;
  emailCliente?: string;
}

// ──â”€ API Functions ────────────────────────────────────────────────────────────

export const processarVenda = async (payload: ProcessarVendaDto) => {
  const { data } = await api.post('/vendas/processar', payload);
  return data;
};

/**
 * Anula uma venda concluída: devolve o stock e retira da gaveta o numerário que a
 * venda lá pôs. A venda passa a CANCELADA e não é apagada, para a numeração de
 * facturas não ter buracos.
 *
 * Exige caixa aberto — uma sessão fechada já teve a quebra apurada.
 */
export const anularVenda = async (vendaId: string, motivo: string) => {
  const { data } = await api.post(`/vendas/${vendaId}/anular`, { motivo });
  return data;
};

export const enviarRecibo = async (vendaId: string, email: string) => {
  const { data } = await api.post(`/vendas/${vendaId}/send-receipt`, { email });
  return data;
};
