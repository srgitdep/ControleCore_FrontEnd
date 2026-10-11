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

/** `GET /commerce/pedidos/:id/entrega` — o que o cliente vê da entrega do seu pedido (plano §4.6). */
export interface EntregaDoPedido {
  id: string;
  estado: 'AGUARDA_RECOLHA' | 'ATRIBUIDA' | 'RECOLHIDA' | 'EM_ROTA' | 'ENTREGUE' | 'FALHADA' | 'DEVOLVIDA' | 'CANCELADA';
  eventos: { tipo: string; em: string }[];
  destino: { morada: string; latitude: number; longitude: number };
  loja: { nome: string; latitude: number | null; longitude: number | null };
  /** Só o primeiro nome: o telefone, o código e o identificador nunca saem do servidor. */
  estafeta: { primeiroNome: string } | null;
  /** Só em rota e com menos de 2 minutos; fora disso, nulo. */
  posicao: { latitude: number; longitude: number; em: string } | null;
  /** Em rota mas sem posição recente: o ecrã diz «sem posição recente» em vez de um pino parado. */
  posicaoDesactualizada: boolean;
  /** Tempo estimado e caminho por estrada (5C). Nulo sem serviço de rotas ou sem posição fresca — nunca um número adivinhado. */
  previsao: { minutos: number; distanciaMetros: number; caminho: { latitude: number; longitude: number }[] } | null;
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

  /** `entrega: null` = o pedido de entrega ainda não foi despachado. */
  entrega: async (id: string) => {
    const { data } = await contaApi.get<{ entrega: EntregaDoPedido | null }>(`${BASE}/${id}/entrega`);
    return data.entrega;
  },

  cancelar: async (id: string) => {
    const { data } = await contaApi.post<{ ok: true }>(`${BASE}/${id}/cancelar`);
    return data;
  },
};

// As etiquetas de cada estado e método de pagamento estão em `src/locales/<língua>/loja.json`
// (`estadoPedido.*`, `metodoPagamento.*`) — v1 é só levantamento em loja.
