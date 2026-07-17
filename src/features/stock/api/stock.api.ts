import { api } from '@/api/axios';
import type { Stock, StockMovement, CreateMovementPayload, CreateTransferPayload, CreateAdjustmentPayload } from '@/features/stock';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  lastPage: number;
}

export const stockApi = {
  // â”€â”€â”€ Consultas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  getStocks: async (params?: { page?: number; limit?: number; search?: string }) => {
    const { data } = await api.get<PaginatedResponse<Stock>>('/stock', { params });
    return data;
  },

  getStockById: async (id: string) => {
    const { data } = await api.get<Stock>(`/stock/${id}`);
    return data;
  },

  getStockMovements: async (stockId: string, params?: { page?: number; limit?: number }) => {
    const { data } = await api.get<PaginatedResponse<StockMovement>>(`/stock/${stockId}/movements`, { params });
    return data;
  },

  getAllMovements: async (params?: { page?: number; limit?: number }) => {
    const { data } = await api.get<PaginatedResponse<StockMovement>>('/stock/movements', { params });
    return data;
  },

  // â”€â”€â”€ MutaÃ§Ãµes (Ledger) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  createMovement: async (payload: CreateMovementPayload) => {
    const { data } = await api.post<StockMovement>('/stock/movement', payload);
    return data;
  },

  createTransfer: async (payload: CreateTransferPayload) => {
    const { data } = await api.post<StockMovement>('/stock/transfer', payload);
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
