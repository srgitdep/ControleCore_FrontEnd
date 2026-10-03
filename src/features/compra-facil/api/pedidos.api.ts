import { contaApi } from './conta.api';

export type EstadoPedido =
  | 'CRIADO'
  | 'CONFIRMADO'
  | 'EM_PREPARACAO'
  | 'PRONTO'
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

// As etiquetas de cada estado e método de pagamento estão em `src/locales/<língua>/loja.json`
// (`estadoPedido.*`, `metodoPagamento.*`) — v1 é só levantamento em loja.
