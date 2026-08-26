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
