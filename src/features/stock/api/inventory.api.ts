import { api } from '@/shared/config';
import type {
  InventoryCycle,
  InventoryCycleDetail,
  CreateCyclePayload,
  RegisterCountPayload,
  RegisterCountByBarcodePayload,
  UpdateCycleStatusPayload,
  InventoryCount,
  CloseCycleResponse,
  PrevisaoDeFechoResponse,
} from '@/features/stock';

export const inventoryApi = {
  // ──â”€ Ciclos ────────────────────────────────────────────────────────────────

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

  /**
   * O que o fecho vai fazer, sem o fazer.
   *
   * O resumo — quantas contagens batem, quantas divergem, e quanto valem as faltas —
   * só era conhecido depois de fechar, quando a operação já é irreversível: escreve
   * movimentos de stock e cria uma despesa financeira por cada falta.
   */
  preverFecho: async (cycleId: string): Promise<PrevisaoDeFechoResponse> => {
    const { data } = await api.get<PrevisaoDeFechoResponse>(
      `/inventory/cycles/${cycleId}/previsao-fecho`,
    );
    return data;
  },

  closeCycle: async (cycleId: string): Promise<CloseCycleResponse> => {
    const { data } = await api.post<CloseCycleResponse>(
      `/inventory/cycles/${cycleId}/close`,
    );
    return data;
  },

  // ──â”€ Contagem ──────────────────────────────────────────────────────────────

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
