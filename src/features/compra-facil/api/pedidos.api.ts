import { contaApi } from './conta.api';

export type EstadoPedido =
  | 'CRIADO'
  | 'CONFIRMADO'
  | 'EM_PREPARACAO'
  | 'PRONTO'
  | 'EXPEDIDO'
  | 'EM_ROTA'
  | 'FALHADA'
  | 'CONCLUIDO'
  | 'CANCELADO';

export type MetodoPagamentoCommerce = 'NUMERARIO' | 'MPESA' | 'EMOLA';

export type TipoEntregaPedido = 'LEVANTAMENTO' | 'ENTREGA';

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
  /** A loja do pedido: os pedidos da conta vêm de todas as lojas e empresas. */
  lojaId: string;
  /** Só na lista «os meus pedidos». */
  loja?: { id: string; nome: string };
  estado: EstadoPedido;
  metodoPagamento: string;
  subtotal: number;
  totalDesconto: number;
  totalFinal: number;
  tipoEntrega: TipoEntregaPedido;
  /** Parte do `totalFinal`; 0 no levantamento. */
  taxaEntrega: number;
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
    tipoEntrega?: TipoEntregaPedido;
    enderecoId?: string;
    /** Obrigatório (true) na primeira compra numa empresa: a pessoa aceitou partilhar os seus dados com ela. */
    aceitaPartilhaDados?: boolean;
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
