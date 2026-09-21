import { contaApi } from './conta.api';

export type EstadoPedido =
  | 'CRIADO'
  | 'AGUARDA_CONFIRMACAO'
  | 'CONFIRMADO'
  | 'EM_PREPARACAO'
  | 'PRONTO'
  | 'AGUARDA_LEVANTAMENTO'
  | 'CONCLUIDO'
  | 'CANCELADO';

export type MetodoPagamentoCommerce = 'NUMERARIO' | 'MPESA' | 'EMOLA';

export interface SubstituicaoPedidoItem {
  produtoSubstitutoId: string | null;
  quantidadeAceite: number;
  motivo: string;
}

export interface PedidoItem {
  id: string;
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  /** Preenchido só depois da conferência (Fase 12) — nulo enquanto o pedido não chega lá. */
  quantidadeConferida?: number | null;
  /** Presente quando o artigo foi ajustado na conferência, com a sua autorização. */
  substituicao?: SubstituicaoPedidoItem | null;
}

export interface Pedido {
  id: string;
  numeroPedido: string;
  estado: EstadoPedido;
  metodoPagamento: string;
  subtotal: number;
  totalDesconto: number;
  totalFinal: number;
  createdAt: string;
  canceladoEm?: string | null;
  motivoCancelamento?: string | null;
  itens: PedidoItem[];
}

const BASE = '/commerce/pedidos';

export const pedidos = {
  criar: async (payload: {
    lojaId: string;
    itens: { produtoId: string; quantidade: number }[];
    metodoPagamento: MetodoPagamentoCommerce;
  }) => {
    const { data } = await contaApi.post<Pedido>(BASE, payload);
    return data;
  },

  listar: async () => {
    const { data } = await contaApi.get<Pedido[]>(BASE);
    return data;
  },

  obter: async (id: string) => {
    const { data } = await contaApi.get<Pedido>(`${BASE}/${id}`);
    return data;
  },

  cancelar: async (id: string) => {
    const { data } = await contaApi.post<{ ok: true }>(`${BASE}/${id}/cancelar`);
    return data;
  },
};

/** O que cada estado significa para o cliente — v1 é só levantamento em loja. */
export const ETIQUETA_ESTADO_PEDIDO: Record<EstadoPedido, string> = {
  CRIADO: 'Recebido',
  AGUARDA_CONFIRMACAO: 'A aguardar confirmação',
  CONFIRMADO: 'Confirmado',
  EM_PREPARACAO: 'Em preparação',
  PRONTO: 'Pronto',
  AGUARDA_LEVANTAMENTO: 'Pronto para levantar',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

export const ETIQUETA_METODO_PAGAMENTO: Record<MetodoPagamentoCommerce, string> = {
  NUMERARIO: 'Numerário no levantamento',
  MPESA: 'M-Pesa no levantamento',
  EMOLA: 'e-Mola no levantamento',
};
