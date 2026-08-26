import { api } from '@/shared/config';
import type { Stock, StockMovement, CreateMovementPayload, CreateTransferPayload, CreateAdjustmentPayload } from '@/features/stock';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  lastPage: number;
}

/** Uma posição de stock de um produto, com o armazém onde existe. */
export interface PosicaoDoProduto {
  id: string;
  armazemId: string;
  currentQuantity: number;
  minQuantity: number;
  custoMedio: number;
  armazem: { id: string; nome: string; tipo: string; isActive: boolean; lojaId: string };
}

export const stockApi = {
  // ──â”€ Consultas ────────────────────────────────────────────────────────────

  getStocks: async (params?: { page?: number; limit?: number; search?: string; armazemId?: string; incluirSemSaldo?: boolean; apenasStockBaixo?: boolean }) => {
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

  /**
   * As posições de stock de um produto, uma por armazém.
   *
   * Serve o formulário de edição do produto, onde se define o ponto de reposição de
   * cada armazém.
   */
  getPosicoesDoProduto: async (produtoId: string) => {
    const { data } = await api.get<PosicaoDoProduto[]>(`/stock/produto/${produtoId}/posicoes`);
    return data;
  },

  /**
   * Define o ponto de reposição de uma posição.
   *
   * O mínimo só era gravado na criação do produto — depois disso não havia nenhuma via
   * para o alterar, pelo que um produto criado sem mínimo ficava fora dos alertas e das
   * sugestões de compra para sempre.
   */
  definirMinimo: async (stockId: string, minimo: number) => {
    const { data } = await api.patch<Stock>(`/stock/${stockId}/minimo`, { minimo });
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
