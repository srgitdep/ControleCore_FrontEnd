import { api } from '@/api/axios';
import type { Stock, StockMovement, CreateMovementPayload, CreateTransferPayload, CreateAdjustmentPayload } from '@/features/stock';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  lastPage: number;
}

export const stockApi = {
  // ──â”€ Consultas ────────────────────────────────────────────────────────────

  getStocks: async (params?: { page?: number; limit?: number; search?: string }) => {
    const { data } = await api.get<PaginatedResponse<Stock>>('/stock', { params });
    return data;
  },

  getStockById: async (id: string) => {
    const { data } = await api.get<Stock>(`/stock/${id}`);
    return data;
  },

  getStockMovements: async (stockId: string, params?: { page?: number; limit?: number }) => {
    const { data } = await api.get<PaginatedResponse<StockMovement>>(`/stock/movements`, { 
      params: { ...params, stockId } 
    });
    return data;
  },

  getAllMovements: async (params?: { page?: number; limit?: number }) => {
    const { data } = await api.get<PaginatedResponse<StockMovement>>('/stock/movements', { params });
    return data;
  },

  // ─── Mutações (Ledger) ────────────────────────────────────────────────
  
  createMovement: async (payload: CreateMovementPayload) => {
    const { data } = await api.post<StockMovement>('/stock/movement', payload);
    return data;
  },

  createTransfer: async (payload: CreateTransferPayload) => {
    const { data } = await api.post<StockMovement>('/stock/transferencia', payload);
    return data;
  },

  createPositiveAdjustment: async (payload: CreateAdjustmentPayload) => {
    const { data } = await api.post<StockMovement>('/stock/ajuste-positivo', payload);
    return data;
  },

  createNegativeAdjustment: async (payload: CreateAdjustmentPayload) => {
    const { data } = await api.post<StockMovement>('/stock/ajuste-negativo', payload);
    return data;
  }
};
