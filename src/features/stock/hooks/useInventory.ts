import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/features/stock';
import type {
  CreateCyclePayload,
  RegisterCountPayload,
  RegisterCountByBarcodePayload,
  UpdateCycleStatusPayload,
} from '@/features/stock';

// ──â”€ Query Keys ──────────────────────────────────────────────────────────────
// Centralizados para invalidação consistente entre hooks
export const inventoryKeys = {
  all: ['inventory'] as const,
  cycles: () => [...inventoryKeys.all, 'cycles'] as const,
  cycleDetail: (id: string) => [...inventoryKeys.cycles(), id] as const,
};

// ──â”€ Queries ────────────────────────────────────────────────────────────────â”€

export const useInventoryCycles = () =>
  useQuery({
    queryKey: inventoryKeys.cycles(),
    queryFn: inventoryApi.listCycles,
    staleTime: 30_000, // 30s — ciclos mudam com pouca frequência
  });

export const useInventoryCycleDetail = (cycleId: string | null) =>
  useQuery({
    queryKey: inventoryKeys.cycleDetail(cycleId ?? ''),
    queryFn: () => inventoryApi.getCycleDetail(cycleId!),
    enabled: !!cycleId,
    staleTime: 10_000,
  });

// ──â”€ Mutations ──────────────────────────────────────────────────────────────â”€

export const useCreateCycle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCyclePayload) => inventoryApi.createCycle(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.cycles() }),
  });
};

export const useUpdateCycleStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cycleId, payload }: { cycleId: string; payload: UpdateCycleStatusPayload }) =>
      inventoryApi.updateCycleStatus(cycleId, payload),
    onSuccess: (_data, { cycleId }) => {
      qc.invalidateQueries({ queryKey: inventoryKeys.cycles() });
      qc.invalidateQueries({ queryKey: inventoryKeys.cycleDetail(cycleId) });
    },
  });
};

export const useCloseCycle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cycleId: string) => inventoryApi.closeCycle(cycleId),
    onSuccess: (_data, cycleId) => {
      qc.invalidateQueries({ queryKey: inventoryKeys.cycles() });
      qc.invalidateQueries({ queryKey: inventoryKeys.cycleDetail(cycleId) });
    },
  });
};

export const useRegisterCount = (cycleId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterCountPayload) =>
      inventoryApi.registerCount(cycleId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.cycleDetail(cycleId) });
      // A lista de ciclos mostra o número de contagens (`_count.counts`); sem esta
      // invalidação, o operador registava dez contagens e a lista continuava a dizer
      // «0 contagem(ns)» até a cache expirar.
      qc.invalidateQueries({ queryKey: inventoryKeys.cycles() });
      // A previsão do fecho é calculada a partir das contagens.
      qc.invalidateQueries({ queryKey: ['inventory', 'previsao-fecho', cycleId] });
    },
  });
};

export const useRegisterCountByBarcode = (cycleId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterCountByBarcodePayload) =>
      inventoryApi.registerCountByBarcode(cycleId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.cycleDetail(cycleId) });
      // A lista de ciclos mostra o número de contagens (`_count.counts`); sem esta
      // invalidação, o operador registava dez contagens e a lista continuava a dizer
      // «0 contagem(ns)» até a cache expirar.
      qc.invalidateQueries({ queryKey: inventoryKeys.cycles() });
      // A previsão do fecho é calculada a partir das contagens.
      qc.invalidateQueries({ queryKey: ['inventory', 'previsao-fecho', cycleId] });
    },
  });
};
