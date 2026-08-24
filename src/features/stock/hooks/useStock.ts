import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockApi } from '@/features/stock';
import toast from 'react-hot-toast';

export function useStockList(params?: { page?: number; limit?: number; search?: string; armazemId?: string; incluirSemSaldo?: boolean }) {
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
    queryClient.invalidateQueries({ queryKey: ['all-stock-movements'] });
    // O POS e o catálogo lêem disponibilidade a partir desta chave: um ajuste ou
    // transferência tem de se reflectir no que o caixa vê.
    //
    // A chave era `'produtos'`, em português, mas a que `useProducts` usa é
    // `'products'` (`useCatalog.ts`) — a invalidação não correspondia a nada e o
    // catálogo mostrava saldos desactualizados até um recarregamento da página. Fica
    // visível agora que o catálogo é um separador ao lado dos saldos.
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const handleError = (error: any) => {
    const message = error.response?.data?.message || 'Ocorreu um erro na operação.';
    toast.error(message);
  };

  const createMovement = useMutation({
    mutationFn: stockApi.createMovement,
    onSuccess: () => handleSuccess('Movimento registado com sucesso.'),
    onError: handleError,
  });

  const createTransfer = useMutation({
    mutationFn: stockApi.createTransfer,
    onSuccess: () => handleSuccess('Transferência realizada com sucesso.'),
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
