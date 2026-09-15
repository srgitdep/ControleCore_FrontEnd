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

  /**
   * Quanto é que o fornecedor confirmou desta linha.
   *
   * A diferença para `quantidadePedida` é o saldo por confirmar: o que ele **não** se
   * comprometeu a entregar, e que precisa de nova decisão de abastecimento. Sem este
   * número, uma confirmação parcial fica indistinguível de uma total, e a falta só
   * aparece no dia da entrega.
   *
   * Ausente em ordens anteriores à governação.
   */
  quantidadeConfirmada?: number;
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

  /**
   * A projecção dos três eixos, mantida para os ecrãs que já a liam.
   *
   * **Perde informação**: uma ordem por aprovar e uma ordem rejeitada aparecem as duas
   * como `RASCUNHO`. Para decidir o que mostrar, olha-se para os eixos.
   */
  estado: EstadoPedidoCompra;

  /** Se a ordem pode sair da empresa. Ausente em ordens anteriores à governação. */
  estadoAprovacao?: EstadoAprovacaoOC;
  /** O que o fornecedor respondeu. */
  estadoComercial?: EstadoComercialOC;
  /** Quanto é que já veio. */
  estadoCumprimento?: EstadoCumprimentoOC;
  cancelamento?: EstadoCancelamentoOC | null;
  motivoCancelamento?: string;

  /** Sobe a cada alteração. As versões anteriores ficam guardadas por inteiro. */
  versao?: number;

  submetidaPor?: { name: string };
  submetidaEm?: string;
  aprovadaPor?: { name: string };
  aprovadaEm?: string;
  motivoDecisao?: string;

  /**
   * Verdadeiro quando quem criou a ordem foi também quem a aprovou.
   *
   * Não é um erro: há estabelecimentos com uma pessoa só, e bloquear levaria a partilha
   * de credenciais. Mas fica visível, que é o ponto.
   */
  sodExcepcao?: boolean;
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

export const purchasesApi = {
  getOrders: async () => {
    const { data } = await api.get<PurchaseOrder[]>('/compras/pedidos');
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

  // ─── Governação (§8) ───────────────────────────────────────────────────────

  /** Marca a ordem como pronta para alguém decidir. Deixa de ser editável. */
  submitOrder: async (id: string) => {
    const { data } = await api.post<PurchaseOrder>(`/compras/pedidos/${id}/submeter`);
    return data;
  },

  /**
   * Marca a ordem como enviada ao fornecedor.
   *
   * Passo próprio e não um efeito da aprovação: aprovar autoriza a compra, enviar
   * comunica-a, e entre os dois passam-se muitas vezes dias. Sem ele, a resposta do
   * fornecedor não tem onde ser registada.
   */
  sendOrder: async (id: string) => {
    const { data } = await api.post<PurchaseOrder>(`/compras/pedidos/${id}/enviar`);
    return data;
  },

  /**
   * Aprova ou rejeita.
   *
   * Quando quem aprova é quem criou, passa mas fica marcado como excepção de segregação
   * de funções. A rejeição exige motivo — é o que quem for corrigir a ordem vai ler.
   */
  decideApproval: async (id: string, dto: { aprovar: boolean; motivo?: string }) => {
    const { data } = await api.post<PurchaseOrder>(`/compras/pedidos/${id}/aprovacao`, dto);
    return data;
  },

  /**
   * Regista o que o fornecedor respondeu.
   *
   * Linhas não mencionadas contam como **não confirmadas**: o silêncio sobre uma linha
   * não é um compromisso de a entregar.
   */
  registerConfirmation: async (
    id: string,
    dto: {
      linhas: LinhaConfirmada[];
      dataPropostaEntrega?: string;
      observacoes?: string;
      canal?: string;
    },
  ) => {
    const { data } = await api.post<{
      tipo: ResultadoConfirmacao['tipo'];
      saldoPorConfirmar: SaldoPorConfirmar[];
      alteracoes: string[];
    }>(`/compras/pedidos/${id}/confirmacao`, dto);
    return data;
  },

  /** O que cada versão dizia, quem alterou, e se a alteração foi material. */
  getVersions: async (id: string) => {
    const { data } = await api.get<VersaoPedido[]>(`/compras/pedidos/${id}/versoes`);
    return data;
  },

  /**
   * Altera as linhas de uma ordem, criando uma versão nova — a anterior fica guardada por
   * inteiro. Se a alteração for material e a ordem estiver aprovada, a aprovação é anulada
   * e ela volta à fila. Linhas com mercadoria já recebida não podem ser removidas nem
   * reduzidas abaixo do que entrou.
   */
  alterarLinhas: async (
    id: string,
    dto: {
      linhas: {
        produtoId: string;
        quantidadePedida: number;
        custoUnitario: number;
        taxaIva?: number;
        desconto?: number;
      }[];
      dataPrevista?: string;
      observacoes?: string;
      motivo?: string;
    },
  ) => {
    const { data } = await api.patch<PurchaseOrder>(`/compras/pedidos/${id}/linhas`, dto);
    return data;
  },
};

// ─── Governação da ordem de compra (§8) ──────────────────────────────────────
//
// O estado passou a ter três eixos, e `estado` é a projecção deles.
//
// A projecção **perde informação**, e é por isso que estes campos existem no cliente: uma
// ordem por aprovar e uma ordem rejeitada aparecem as duas como `RASCUNHO`. Quem decide o
// que mostrar tem de olhar para os eixos, e não para a projecção — foi assim que o botão
// de dar entrada de mercadoria deixou de aparecer em pedidos novos.

export const EstadoAprovacaoOC = {
  RASCUNHO: 'RASCUNHO',
  AGUARDA_APROVACAO: 'AGUARDA_APROVACAO',
  APROVADA: 'APROVADA',
  REJEITADA: 'REJEITADA',
} as const;
export type EstadoAprovacaoOC = (typeof EstadoAprovacaoOC)[keyof typeof EstadoAprovacaoOC];

export const EstadoComercialOC = {
  NAO_ENVIADA: 'NAO_ENVIADA',
  ENVIADA: 'ENVIADA',
  AGUARDA_RESPOSTA: 'AGUARDA_RESPOSTA',
  ACEITE: 'ACEITE',
  ACEITE_COM_ALTERACOES: 'ACEITE_COM_ALTERACOES',
  PARCIALMENTE_CONFIRMADA: 'PARCIALMENTE_CONFIRMADA',
  RECUSADA: 'RECUSADA',
} as const;
export type EstadoComercialOC = (typeof EstadoComercialOC)[keyof typeof EstadoComercialOC];

export const EstadoCumprimentoOC = {
  PENDENTE: 'PENDENTE',
  PARCIALMENTE_EXPEDIDA: 'PARCIALMENTE_EXPEDIDA',
  TOTALMENTE_EXPEDIDA: 'TOTALMENTE_EXPEDIDA',
  PARCIALMENTE_RECEBIDA: 'PARCIALMENTE_RECEBIDA',
  TOTALMENTE_RECEBIDA: 'TOTALMENTE_RECEBIDA',
  ENCERRADA: 'ENCERRADA',
} as const;
export type EstadoCumprimentoOC = (typeof EstadoCumprimentoOC)[keyof typeof EstadoCumprimentoOC];

export type EstadoCancelamentoOC = 'SOLICITADO' | 'CANCELADA';

export interface VersaoPedido {
  id: string;
  versao: number;
  conteudo: unknown;
  /** Se a alteração invalidou a aprovação. */
  materialidade: boolean;
  motivoAlteracao?: string;
  criadaEm: string;
  alteradaPor?: { name: string };
}

export interface LinhaConfirmada {
  itemId: string;
  quantidadeConfirmada: number;
  /** Vazio significa «aceita o preço da ordem» — não é preço zero. */
  precoConfirmado?: number;
}

export interface SaldoPorConfirmar {
  itemId: string;
  produtoId: string;
  quantidade: number;
}

export interface ResultadoConfirmacao {
  tipo: 'ACEITE_TOTAL' | 'ACEITE_PARCIAL' | 'ACEITE_COM_ALTERACOES' | 'RECUSA';
  /** O §8.3 em números: o que é preciso voltar a decidir. */
  saldoPorConfirmar: SaldoPorConfirmar[];
  alteracoes: string[];
}

/**
 * Se se pode dar entrada de mercadoria contra esta ordem.
 *
 * Espelha `podeReceber` do backend. Duplicar a regra no cliente é aceitável — e
 * preferível a esconder o botão por engano — porque o backend continua a ser quem decide:
 * aqui só se evita mostrar uma acção que ia dar erro.
 *
 * Ordens anteriores à governação não têm os eixos preenchidos na listagem; nesse caso
 * cai-se na projecção, que é o que o ecrã sempre usou.
 */
export function podeReceberMercadoria(p: PurchaseOrder): boolean {
  if (p.cancelamento === 'CANCELADA') return false;

  if (p.estadoAprovacao) {
    return (
      p.estadoAprovacao === EstadoAprovacaoOC.APROVADA &&
      p.estadoCumprimento !== EstadoCumprimentoOC.TOTALMENTE_RECEBIDA &&
      p.estadoCumprimento !== EstadoCumprimentoOC.ENCERRADA
    );
  }

  return p.estado === EstadoPedidoCompra.ENVIADO || p.estado === EstadoPedidoCompra.PARCIAL;
}

/** Se a ordem está à espera de ser submetida para aprovação. */
export function podeSubmeter(p: PurchaseOrder): boolean {
  if (!p.estadoAprovacao || p.cancelamento === 'CANCELADA') return false;
  return (
    p.estadoAprovacao === EstadoAprovacaoOC.RASCUNHO ||
    p.estadoAprovacao === EstadoAprovacaoOC.REJEITADA
  );
}

/** Se há uma decisão de aprovação por tomar. */
export function podeDecidir(p: PurchaseOrder): boolean {
  return p.estadoAprovacao === EstadoAprovacaoOC.AGUARDA_APROVACAO && p.cancelamento !== 'CANCELADA';
}

/** Se a ordem está aprovada mas ainda não saiu para o fornecedor. */
export function podeEnviar(p: PurchaseOrder): boolean {
  return (
    p.estadoAprovacao === EstadoAprovacaoOC.APROVADA &&
    p.estadoComercial === EstadoComercialOC.NAO_ENVIADA &&
    p.cancelamento !== 'CANCELADA'
  );
}

/** Se faz sentido registar a resposta do fornecedor. */
export function podeConfirmar(p: PurchaseOrder): boolean {
  if (!p.estadoComercial || p.cancelamento === 'CANCELADA') return false;
  return (
    p.estadoAprovacao === EstadoAprovacaoOC.APROVADA &&
    p.estadoComercial !== EstadoComercialOC.NAO_ENVIADA
  );
}

/** O que falta confirmar de uma linha. Zero quando o fornecedor confirmou tudo. */
export function saldoPorConfirmar(item: PurchaseOrderItem): number {
  return Math.max(item.quantidadePedida - (item.quantidadeConfirmada ?? 0), 0);
}

/**
 * Se as linhas da ordem podem ser alteradas.
 *
 * Uma ordem encerrada ou já cancelada não tem mais o que mudar. O backend continua a ser
 * quem decide — inclusive recusando a remoção de uma linha já recebida — isto só evita
 * mostrar a acção quando ela claramente não se aplica.
 */
export function podeAlterarLinhas(p: PurchaseOrder): boolean {
  if (p.cancelamento === 'CANCELADA') return false;
  if (p.estadoCumprimento === EstadoCumprimentoOC.ENCERRADA) return false;
  return true;
}

/** Se a ordem ainda pode ser cancelada. Uma ordem já recebida não volta atrás por aqui. */
export function podeCancelarPedido(p: PurchaseOrder): boolean {
  if (p.cancelamento === 'CANCELADA') return false;
  return (
    p.estadoCumprimento !== EstadoCumprimentoOC.TOTALMENTE_RECEBIDA &&
    p.estadoCumprimento !== EstadoCumprimentoOC.ENCERRADA
  );
}
