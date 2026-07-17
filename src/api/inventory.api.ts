import { api } from './axios';
import type {
  InventoryCycle,
  InventoryCycleDetail,
  CreateCyclePayload,
  RegisterCountPayload,
  RegisterCountByBarcodePayload,
  UpdateCycleStatusPayload,
  InventoryCount,
  CloseCycleResponse,
} from '@/features/stock';

export const inventoryApi = {
  // â”€â”€â”€ Ciclos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  listCycles: async (): Promise<InventoryCycle[]> => {
    const { data } = await api.get<InventoryCycle[]>('/inventory/cycles');
    return data;
  },

  getCycleDetail: async (cycleId: string): Promise<InventoryCycleDetail> => {
    const { data } = await api.get<InventoryCycleDetail>(`/inventory/cycles/${cycleId}`);
    return data;
  },

  createCycle: async (payload: CreateCyclePayload): Promise<InventoryCycle> => {
    const { data } = await api.post<InventoryCycle>('/inventory/cycles', payload);
    return data;
  },

  updateCycleStatus: async (
    cycleId: string,
    payload: UpdateCycleStatusPayload,
  ): Promise<InventoryCycle> => {
    const { data } = await api.patch<InventoryCycle>(
      `/inventory/cycles/${cycleId}/status`,
      payload,
    );
    return data;
  },

  closeCycle: async (cycleId: string): Promise<CloseCycleResponse> => {
    const { data } = await api.post<CloseCycleResponse>(
      `/inventory/cycles/${cycleId}/close`,
    );
    return data;
  },

  // â”€â”€â”€ Contagem â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  registerCount: async (
    cycleId: string,
    payload: RegisterCountPayload,
  ): Promise<InventoryCount> => {
    const { data } = await api.post<InventoryCount>(
      `/inventory/cycles/${cycleId}/counts`,
      payload,
    );
    return data;
  },

  registerCountByBarcode: async (
    cycleId: string,
    payload: RegisterCountByBarcodePayload,
  ): Promise<InventoryCount> => {
    const { data } = await api.post<InventoryCount>(
      `/inventory/cycles/${cycleId}/counts/barcode`,
      payload,
    );
    return data;
  },
};
