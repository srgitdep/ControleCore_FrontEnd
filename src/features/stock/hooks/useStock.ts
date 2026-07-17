import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockApi } from '@/features/stock';
import toast from 'react-hot-toast';

export function useStockList(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['stocks', params],
    queryFn: () => stockApi.getStocks(params),
    placeholderData: (prev) => prev,
  });
}

export function useStockDetails(stockId: string) {
  return useQuery({
    queryKey: ['stock', stockId],
    queryFn: () => stockApi.getStockById(stockId),
    enabled: !!stockId,
  });
}

export function useStockMovements(stockId: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['stock-movements', stockId, params],
    queryFn: () => stockApi.getStockMovements(stockId, params),
    enabled: !!stockId,
    placeholderData: (prev) => prev,
  });
}

// Movimentos globais da empresa (sem filtro por stockId) para a aba "Movimentos"
export function useAllMovements(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['all-stock-movements', params],
    queryFn: () => stockApi.getAllMovements(params),
    placeholderData: (prev) => prev,
  });
}

export function useStockMutations() {
  const queryClient = useQueryClient();

  const handleSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['stocks'] });
    queryClient.invalidateQueries({ queryKey: ['stock'] });
    queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
  };

  const handleError = (error: any) => {
    const message = error.response?.data?.message || 'Ocorreu um erro na operaÃ§Ã£o.';
    toast.error(message);
  };

  const createMovement = useMutation({
    mutationFn: stockApi.createMovement,
    onSuccess: () => handleSuccess('Movimento registado com sucesso.'),
    onError: handleError,
  });

  const createTransfer = useMutation({
    mutationFn: stockApi.createTransfer,
    onSuccess: () => handleSuccess('TransferÃªncia realizada com sucesso.'),
    onError: handleError,
  });

  const createPositiveAdjustment = useMutation({
    mutationFn: stockApi.createPositiveAdjustment,
    onSuccess: () => handleSuccess('Ajuste positivo registado com sucesso.'),
    onError: handleError,
  });

  const createNegativeAdjustment = useMutation({
    mutationFn: stockApi.createNegativeAdjustment,
    onSuccess: () => handleSuccess('Ajuste negativo registado com sucesso.'),
    onError: handleError,
  });

  return {
    createMovement,
    createTransfer,
    createPositiveAdjustment,
    createNegativeAdjustment,
  };
}
