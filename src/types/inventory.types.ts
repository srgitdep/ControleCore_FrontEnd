// â”€â”€â”€ Enums (espelha o schema Prisma â€” sem importaÃ§Ã£o direta) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type InventoryCycleStatus = 'OPEN' | 'COUNTING' | 'RECONCILING' | 'CLOSED';

// â”€â”€â”€ Entidades base â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface InventoryCount {
  id: string;
  cycleId: string;
  stockId: string;
  operatorId: string;

  // Dados calculados no momento da contagem (snapshot imutÃ¡vel)
  systemQuantity: number;
  physicalQuantity: number;
  difference: number; // positivo = sobra, negativo = falta

  createdAt: string;

  // RelaÃ§Ãµes opcionais (incluÃ­das no getCycleDetail)
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
}

export interface InventoryCycle {
  id: string;
  empresaId: string;
  name: string;
  status: InventoryCycleStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;

  // RelaÃ§Ãµes opcionais
  createdBy?: { id: string; name: string };
  _count?: { counts: number };
}

export interface InventoryCycleDetail extends InventoryCycle {
  counts: InventoryCount[];
}

// â”€â”€â”€ Payloads de mutaÃ§Ã£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface CreateCyclePayload {
  name: string;
}

export interface RegisterCountPayload {
  stockId: string;
  physicalQuantity: number;
}

export interface RegisterCountByBarcodePayload {
  codigoBarras: string;
  physicalQuantity: number;
  armazemId?: string;
}

export interface UpdateCycleStatusPayload {
  status: InventoryCycleStatus;
}

// â”€â”€â”€ Resposta do fecho de ciclo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
