export type StockMovementType = 
  | 'IN'
  | 'OUT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUSTMENT_PLUS'
  | 'ADJUSTMENT_MINUS';

export interface Stock {
  id: string;
  empresaId: string;
  productId: string;
  currentQuantity: number;
  minQuantity: number;
  createdAt: string;
  updatedAt: string;
  
  // RelaÃ§Ãµes opcionais (quando o backend faz include)
  product?: {
    id: string;
    nome: string;
    codigoBarras?: string;
    imagemUrl?: string;
    precoVenda?: number; // Relevant for POS
    unidadeMedida?: string; // e.g. 'UN', 'KG', 'L'
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
  
  // RelaÃ§Ãµes opcionais
  user?: {
    id: string;
    nome: string;
  };
}

// â”€â”€â”€ Interfaces para MutaÃ§Ãµes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
