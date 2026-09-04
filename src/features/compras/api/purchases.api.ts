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
    /**
     * Se a entrada de mercadoria deste produto exige data de validade e código de lote.
     *
     * O backend recusa a recepção sem eles, e a recusa chega com o camião à porta. O modal
     * usa estes campos para exigir o preenchimento antes de submeter — é a diferença entre
     * um aviso no ecrã e um erro depois de carregar em Confirmar.
     */
    temValidade?: boolean;
    rastreavelPorLote?: boolean;
    diasAvisoValidade?: number | null;
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
    /**
     * Lote e validade da mercadoria que entra.
     *
     * A recepção é o único momento em que alguém tem estes dados à frente dos olhos — no
     * documento do fornecedor e na embalagem. Não os capturar aqui é não os capturar nunca:
     * nenhum ecrã posterior sabe que aqueles 50 sacos expiram em Março.
     *
     * Sem código de lote mas com validade, o backend deriva o código da própria data
     * (`V-2027-03-12`): é a validade que distingue mercadoria no armazém, não o número
     * impresso.
     */
    lote?: string;
    /** ISO 8601 (`2027-03-12`). Obrigatória se o produto tiver `temValidade`. */
    dataValidade?: string;
    dataProducao?: string;
  }[];
}

// ─── Sugestão de compras ─────────────────────────────────────────────────────

export type MotivoSugestao = 'RUPTURA' | 'ABAIXO_MINIMO' | 'VELOCIDADE';
export type UrgenciaSugestao = 'CRITICA' | 'ALTA' | 'MEDIA';

export interface SugestaoCompra {
  produtoId: string;
  nome: string;
  stockActual: number;
  stockMinimo: number;
  /** Unidades vendidas por dia na janela observada. */
  mediaDiaria: number;
  /** Dias até o saldo acabar. `null` quando não houve venda na janela. */
  diasRestantes: number | null;
  quantidadeSugerida: number;
  valorEstimado: number;
  motivo: MotivoSugestao;
  urgencia: UrgenciaSugestao;
  fornecedorSugerido: { id: string; nome: string; custoCompra: number } | null;
}

export interface ResultadoSugestao {
  sugestoes: SugestaoCompra[];
  resumo: {
    total: number;
    emRuptura: number;
    abaixoDoMinimo: number;
    valorEstimado: number;
    janelaDias: number;
    diasCobertura: number;
    /** Linhas que ficaram fora do limite — não truncar em silêncio. */
    omitidas: number;
  };
}

// ─── Conferência a três ──────────────────────────────────────────────────────

/**
 * Uma linha da comparação entre o que foi pedido, o que foi facturado e o que entrou.
 *
 * As três vias respondem a perguntas diferentes, e é por isso que são três: `pedida` é o
 * que a empresa autorizou comprar, `facturada` é o que o fornecedor diz ter enviado e
 * cobra, `recebida` é o que o armazém contou. Uma factura paga-se quando as três fecham.
 */
export interface LinhaTresVias {
  produtoId: string;
  produto?: string;
  pedida: number;
  facturada: number;
  recebida: number;
  /** Se esta linha fecha dentro da tolerância pedida. */
  conforme: boolean;
  /** `recebida - facturada`. Negativo significa pagar mercadoria que não chegou. */
  diferencaQuantidade: number;
  /** `custoFacturado - custoPedido`. Positivo significa cobrança acima do acordado. */
  diferencaCusto: number;
  /** O que está errado, em português, uma frase por problema. Vazio quando conforme. */
  observacoes: string[];
}

export interface ConferenciaTresVias {
  pedidoId: string;
  fornecedor: string;
  estado: EstadoPedidoCompra;
  /** A percentagem de divergência que foi tolerada nesta leitura. */
  tolerancia: number;
  linhas: LinhaTresVias[];
  /** `true` quando todas as linhas fecham. É o que autoriza o pagamento. */
  conforme: boolean;
}

export const purchasesApi = {
  getOrders: async () => {
    const { data } = await api.get<PurchaseOrder[]>('/compras/pedidos');
    return data;
  },

  /**
   * Compara pedido, factura e recepção de uma ordem inteira.
   *
   * ## Porque isto não é a comparação da descarga
   *
   * A recepção já compara as três vias linha a linha, com o camião no cais — que é quando
   * uma divergência se resolve. Esta é a mesma pergunta feita sobre o **acumulado** da
   * ordem, e apanha o que só se vê no conjunto: três recepções parciais que somam mais do
   * que foi encomendado, ou um preço que subiu entre a primeira factura e a terceira.
   *
   * Recepções anuladas ficam de fora: a mercadoria voltou por movimento inverso, e
   * contá-las acusaria um excesso que já foi desfeito.
   */
  compararTresVias: async (id: string, tolerancia = 0) => {
    const { data } = await api.get<ConferenciaTresVias>(
      `/compras/pedidos/${id}/three-way-match`,
      { params: { tolerancia } },
    );
    return data;
  },

  /**
   * O que repor e quanto.
   *
   * Substitui o `toast.success('Sugestão gerada. (Simulação MVP)')` que não fazia
   * nenhuma chamada de rede. Cruza o ponto de reposição de cada armazém com a
   * velocidade de venda.
   */
  getSugestoes: async (params?: {
    janelaDias?: number;
    diasCobertura?: number;
    fornecedorId?: string;
  }) => {
    const { data } = await api.get<ResultadoSugestao>('/compras/sugestoes', { params });
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
