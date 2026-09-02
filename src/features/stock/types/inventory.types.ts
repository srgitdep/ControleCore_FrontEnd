// ──â”€ Enums (espelha o schema Prisma — sem importação direta) ──────────────────
export type InventoryCycleStatus = 'OPEN' | 'COUNTING' | 'RECONCILING' | 'CLOSED';

// ──â”€ Entidades base ──────────────────────────────────────────────────────────â”€

export interface InventoryCount {
  id: string;
  cycleId: string;
  stockId: string;
  operatorId: string;

  // Dados calculados no momento da contagem (snapshot imutável)
  /**
   * O que o sistema esperava. **Ausente num ciclo cego enquanto se conta** — continua gravado,
   * mas não é devolvido: com o número esperado à frente, contar transforma-se em confirmar.
   */
  systemQuantity?: number;
  physicalQuantity: number;
  difference?: number; // positivo = sobra, negativo = falta

  createdAt: string;

  // Relações opcionais (incluÍdas no getCycleDetail)
  stock?: {
    id: string;
    currentQuantity: number;
    product?: {
      id: string;
      nome: string;
      codigoBarras?: string;
      unidadeMedida: string;
    };
    armazem?: {
      id: string;
      nome: string;
    };
  };
  operator?: {
    id: string;
    name: string;
  };

  /**
   * A posição física contada. Nula conta o saldo do armazém inteiro, como sempre foi.
   *
   * Contar por prateleira é o que se pode fazer com a loja aberta, um corredor de cada vez.
   */
  localizacaoId?: string | null;
  localizacao?: { id: string; caminho: string } | null;
  loteId?: string | null;
  lote?: { id: string; codigo: string; dataValidade: string | null } | null;
}

export interface InventoryCycle {
  id: string;
  empresaId: string;
  name: string;
  status: InventoryCycleStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;

  /** Limita o ciclo a um armazém. Nulo é a empresa toda. */
  armazemId?: string | null;

  /**
   * Limita o ciclo a uma posição física e a tudo o que está por baixo dela.
   *
   * Contar «B / 04» inclui «B / 04 / 03». É o que permite dois ciclos vivos ao mesmo tempo
   * em corredores diferentes — o inventário rotativo.
   */
  localizacaoId?: string | null;

  /**
   * Se quem conta vê o que o sistema espera.
   *
   * Com contagem cega, `systemQuantity` e `difference` **não vêm na resposta** enquanto o
   * ciclo está a contar. Não é o ecrã que os esconde: não chegam ao browser.
   */
  contagemCega?: boolean;

  // Relações opcionais
  createdBy?: { id: string; name: string };
  armazem?: { id: string; nome: string } | null;
  localizacao?: { id: string; caminho: string } | null;
  _count?: { counts: number };
}

export interface InventoryCycleDetail extends InventoryCycle {
  counts: InventoryCount[];
}

// ──â”€ Payloads de mutação ──────────────────────────────────────────────────────

export interface CreateCyclePayload {
  name: string;
  armazemId?: string;
  localizacaoId?: string;
  contagemCega?: boolean;
}

export interface RegisterCountPayload {
  stockId: string;
  physicalQuantity: number;
  /** Obrigatória num ciclo limitado a um corredor: sem ela não se sabe se a contagem lhe pertence. */
  localizacaoId?: string;
  loteId?: string;
}

export interface RegisterCountByBarcodePayload {
  codigoBarras: string;
  physicalQuantity: number;
  armazemId?: string;
}

export interface UpdateCycleStatusPayload {
  status: InventoryCycleStatus;
}

// ──â”€ Resposta do fecho de ciclo ──────────────────────────────────────────────â”€

export interface CloseCycleResponse {
  cycleId: string;
  cycleName: string;
  status: 'CLOSED';
  summary: {
    totalCounts: number;
    totalAdjustments: number;
    totalLosses: number;
    lossDetails: Array<{
      stockId: string;
      productName: string;
      difference: number;
      valorPerda: number;
    }>;
  };
}

// ──â”€ Previsão do fecho ────────────────────────────────────────────────────────

/**
 * O que o fecho vai fazer, antes de o fazer.
 *
 * `semDivergencia` é a resposta a «a contagem bate com o sistema?»: são as linhas em
 * que o que se contou é exactamente o que o sistema tinha.
 */
export interface PrevisaoDeFechoResponse {
  cycleId: string;
  cycleName: string;
  status: InventoryCycleStatus;
  podeFechar: boolean;
  resumo: {
    totalContado: number;
    semDivergencia: number;
    comDivergencia: number;
    faltas: number;
    sobras: number;
    /** Entra como despesa no financeiro ao fechar. */
    valorFaltas: number;
    valorSobras: number;
  };
  divergencias: Array<{
    stockId: string;
    produtoId: string | null;
    produto: string;
    armazem: string | null;
    sistema: number;
    contado: number;
    diferenca: number;
    valor: number;
    operador: string | null;
    contadoEm: string;
  }>;
}
