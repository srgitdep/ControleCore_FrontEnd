import { api } from '@/shared/config';
import type { Supplier } from '@/features/fornecedores';

export const EstadoPedidoCompra = {
  RASCUNHO: 'RASCUNHO',
  ENVIADO: 'ENVIADO',
  PENDENTE: 'PENDENTE',
  PARCIAL: 'PARCIAL',
  RECEBIDO: 'RECEBIDO',
  CANCELADO: 'CANCELADO',
} as const;

export type EstadoPedidoCompra = (typeof EstadoPedidoCompra)[keyof typeof EstadoPedidoCompra];

export interface PurchaseOrderItem {
  id: string;
  produtoId: string;
  quantidadePedida: number;
  quantidadeRecebida: number;
  custoUnitario: number;
  taxaIva: number;
  desconto: number;
  produto?: {
    id: string;
    nome: string;
    codigoBarras?: string;
  };
}

export interface Rececao {
  id: string;
  dataRececao: string;
  documentoRef?: string;
  observacoes?: string;
  /** Recepções anuladas mantêm-se no histórico, marcadas. */
  anulada: boolean;
  anuladaEm?: string;
  motivoAnulacao?: string;
  armazem?: { nome: string };
  recebidoPor?: { name: string };
  itens?: {
    id: string;
    quantidade: number;
    custoUnitario: number;
    produto?: { nome: string };
  }[];
}

export interface PurchaseOrder {
  id: string;
  fornecedorId: string;
  estado: EstadoPedidoCompra;
  dataPedido: string;
  dataPrevista?: string;
  observacoes?: string;
  fornecedor?: Supplier;
  criadoPor?: { id: string; name: string };
  itens?: PurchaseOrderItem[];
  /** Só vem em `getOrderById`, não na listagem. */
  rececoes?: Rececao[];
}

export interface CreatePurchaseOrderDto {
  fornecedorId: string;
  dataPrevista?: string;
  observacoes?: string;
  itens: {
    produtoId: string;
    quantidade: number;
    custoUnitario: number;
    taxaIva: number;
    desconto: number;
  }[];
}

export interface ReceiveMercadoriaDto {
  armazemId: string;
  documentoRef?: string;
  observacoes?: string;
  itens: {
    produtoId: string;
    quantidade: number;
    custoUnitario: number;
  }[];
}

export const purchasesApi = {
  getOrders: async () => {
    const { data } = await api.get<PurchaseOrder[]>('/compras/pedidos');
    return data;
  },
  getOrderById: async (id: string) => {
    const { data } = await api.get<PurchaseOrder>(`/compras/pedidos/${id}`);
    return data;
  },
  createOrder: async (dto: CreatePurchaseOrderDto) => {
    const { data } = await api.post<PurchaseOrder>('/compras/pedidos', dto);
    return data;
  },
  updateOrderStatus: async (id: string, estado: EstadoPedidoCompra) => {
    const { data } = await api.patch<PurchaseOrder>(`/compras/pedidos/${id}/status`, { estado });
    return data;
  },
  receiveOrder: async (id: string, dto: ReceiveMercadoriaDto) => {
    const { data } = await api.post(`/compras/pedidos/${id}/rececao`, dto);
    return data;
  },

  /**
   * Anula uma recepção: devolve o stock, reverte o custo médio e cancela a conta a
   * pagar ao fornecedor. A recepção não é apagada — fica marcada como anulada, com
   * autor e motivo, e o pedido reabre para poder ser recebido de novo.
   */
  cancelReceipt: async (rececaoId: string, motivo: string) => {
    const { data } = await api.post(`/compras/rececoes/${rececaoId}/anular`, { motivo });
    return data;
  },
};
