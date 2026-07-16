import { api } from './axios';
import type { Supplier } from './suppliers.api';

export enum EstadoPedidoCompra {
  RASCUNHO = 'RASCUNHO',
  ENVIADO = 'ENVIADO',
  PENDENTE = 'PENDENTE',
  PARCIAL = 'PARCIAL',
  RECEBIDO = 'RECEBIDO',
  CANCELADO = 'CANCELADO',
}

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
};
