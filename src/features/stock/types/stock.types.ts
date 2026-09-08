/**
 * Os tipos de movimento que existem de facto.
 *
 * O enum `MovementType` do Prisma tem **três** valores. Este tipo declarava seis,
 * acrescentando `TRANSFER_IN`, `TRANSFER_OUT`, `ADJUSTMENT_PLUS` e
 * `ADJUSTMENT_MINUS` — que nunca chegam do servidor. As transferências são gravadas
 * como um `OUT` na origem e um `IN` no destino; os ajustes, positivos ou negativos,
 * são `ADJUSTMENT` com quantidade assinada.
 *
 * A consequência era código morto: a tradução de tipos tratava casos que não ocorrem.
 */
export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

/**
 * Os estados de uma posição de stock (§10), com o disponível já calculado.
 *
 *     DISPONÍVEL = FÍSICO − RESERVADO − BLOQUEADO − QUARENTENA
 *
 * O trânsito não está aqui: é propriedade de uma transferência a caminho e não de uma
 * posição, e não entra na fórmula porque ainda não é existência física de nenhum armazém.
 */
export interface EstadosDaPosicao {
  /** Existência física, incluindo o que não pode sair. */
  fisico: number;
  /** Comprometido com pedidos ainda não expedidos. */
  reservado: number;
  /** Recebido e à espera de aprovação, ou retido para análise. */
  quarentena: number;
  /** Impedido de sair por decisão humana. */
  bloqueado: number;
  /** O que se pode efectivamente vender. */
  disponivel: number;
  /**
   * As parcelas comprometidas excedem a existência física.
   *
   * Não devia acontecer, e por isso é mostrado em vez de escondido: significa que uma
   * reserva, uma quarentena ou um bloqueio sobreviveu a uma saída de mercadoria.
   */
  inconsistente: boolean;
}

/** Uma reserva de stock (§14). */
export type EstadoReserva = 'ACTIVA' | 'CONSUMIDA' | 'LIBERTADA' | 'EXPIRADA';

export interface ReservaStock {
  id: string;
  stockId: string;
  quantidade: number;
  estado: EstadoReserva;
  /** `null` quando a reserva não caduca sozinha. */
  expiraEm: string | null;
  referencia?: string | null;
  motivo?: string | null;
  resolvidoEm: string | null;
  createdAt: string;
  stock?: {
    id: string;
    currentQuantity: number;
    product?: { id: string; nome: string };
    armazem?: { id: string; nome: string };
  };
  criadoPor?: { id: string; name: string };
}

export interface Stock {
  id: string;
  empresaId: string;
  productId: string;
  /** O armazém onde esta posição existe. Vinha do backend e não era declarado. */
  armazemId: string;
  currentQuantity: number;
  minQuantity: number;
  /**
   * Se esta posição está abaixo do mínimo definido.
   *
   * Calculado no servidor de propósito. A regra tem uma subtileza — `minQuantity = 0`
   * significa «sem mínimo definido», não «mínimo de zero» — que já foi implementada
   * mal em três sítios ao mesmo tempo, com o painel a contar de uma maneira e a
   * tabela a pintar de outra.
   */
  abaixoDoMinimo?: boolean;
  /** Custo médio ponderado neste armazém. Recalculado a cada entrada de compra. */
  custoMedio: number;

  /**
   * A decomposição do saldo nos estados do §10, calculada no servidor.
   *
   * Vem de lá e não é recalculada aqui pela mesma razão que `abaixoDoMinimo`: a fórmula tem
   * subtilezas (nunca negativo; parcelas ausentes contam como zero) e duas implementações
   * divergiriam.
   *
   * É o que permite ao ecrã explicar uma recusa. Desde que a disponibilidade é verificada no
   * abate, uma venda pode ser recusada sobre uma prateleira cheia — e sem estes números o
   * operador vê «stock insuficiente» ao lado de «100 unidades» e conclui, com razão, que o
   * sistema está errado.
   *
   * Opcional: respostas de endpoints que ainda não o incluem chegam sem ele.
   */
  estados?: EstadosDaPosicao;
  createdAt: string;
  updatedAt: string;

  // Relações opcionais (quando o backend faz include)
  product?: {
    id: string;
    nome: string;
    codigoBarras?: string;
    sku?: string;
    imagemUrl?: string;
    precoVenda?: number; // Relevante para o POS
    precoCusto?: number;
    unidadeMedida?: string; // 'UN', 'KG', 'L', ...
  };
  armazem?: {
    id: string;
    nome: string;
    tipo?: string;
    isActive?: boolean;
  };
}

export interface StockMovement {
  id: string;
  stockId: string;
  empresaId: string;
  userId: string;
  type: StockMovementType;
  quantity: number;
  balanceAfter: number;
  reason?: string;
  createdAt: string;

  // Relações opcionais
  //
  // O campo chamava-se `nome`, mas o backend faz `select: { id, name, email }` — pelo
  // que `user.nome` era sempre `undefined` e o histórico mostrava «Sistema» em todos
  // os movimentos, inclusive nos feitos por pessoas.
  user?: {
    id: string;
    name: string;
    email?: string;
  };
  /** O produto e o armazém do movimento. O backend inclui-os na listagem geral. */
  stock?: Stock;
}

// ──â”€ Interfaces para Mutações ────────────────────────────────────────────────

export interface CreateMovementPayload {
  stockId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  reason?: string;
}

export interface CreateTransferPayload {
  sourceStockId: string;
  destinationStockId: string;
  quantity: number;
  reason?: string;
}

export interface CreateAdjustmentPayload {
  stockId: string;
  quantity: number;
  reason: string;
}
