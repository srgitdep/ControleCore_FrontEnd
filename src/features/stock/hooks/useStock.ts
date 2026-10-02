import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockApi } from '@/features/stock';
import toast from 'react-hot-toast';
import i18n from '@/i18n';

export function useStockList(params?: { page?: number; limit?: number; search?: string; armazemId?: string; incluirSemSaldo?: boolean; apenasStockBaixo?: boolean }) {
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
    const message = error.response?.data?.message || i18n.t('stock:movimentos.erro_operacao');
    toast.error(message);
  };

  const createMovement = useMutation({
    mutationFn: stockApi.createMovement,
    onSuccess: () => handleSuccess(i18n.t('stock:movimentos.registado')),
    onError: handleError,
  });

  const createTransfer = useMutation({
    mutationFn: stockApi.createTransfer,
    onSuccess: () => handleSuccess(i18n.t('stock:movimentos.transferencia_realizada')),
    onError: handleError,
  });

  const createPositiveAdjustment = useMutation({
    mutationFn: stockApi.createPositiveAdjustment,
    onSuccess: () => handleSuccess(i18n.t('stock:movimentos.ajuste_positivo_registado')),
    onError: handleError,
  });

  const createNegativeAdjustment = useMutation({
    mutationFn: stockApi.createNegativeAdjustment,
    onSuccess: () => handleSuccess(i18n.t('stock:movimentos.ajuste_negativo_registado')),
    onError: handleError,
  });

  return {
    createMovement,
    createTransfer,
    createPositiveAdjustment,
    createNegativeAdjustment,
  };
}
