import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDreSummary,
  getCashFlowProjection,
  getContasReceber,
  getContasPagar,
  processarPagamento,
  criarRegistro,
  getRelatorioLucro
} from '../api/finance.api';
import type { CriarRegistroDto } from '../api/finance.api';
import toast from 'react-hot-toast';

export function useDreSummary(mes: number, ano: number) {
  return useQuery({
    queryKey: ['dre-summary', mes, ano],
    queryFn: () => getDreSummary(mes, ano),
  });
}

/**
 * Lucro, margem, quebras de caixa e produtos mais vendidos do mês.
 *
 * `enabled` deixa a consulta em espera até o separador ser aberto: o relatório percorre
 * todos os itens vendidos no mês e todas as sessões de caixa, e não vale correr isso a
 * cada visita ao Financeiro para quem só vem ver contas a pagar.
 */
export function useRelatorioLucro(mes: number, ano: number, enabled = true) {
  return useQuery({
    queryKey: ['relatorio-lucro', mes, ano],
    queryFn: () => getRelatorioLucro(mes, ano),
    enabled,
  });
}

export function useCashFlowProjection(dias = 30) {
  return useQuery({
    queryKey: ['cash-flow', dias],
    queryFn: () => getCashFlowProjection(dias),
  });
}

export function useContasReceber(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['contas-receber', page, limit],
    queryFn: () => getContasReceber(page, limit),
  });
}

export function useContasPagar(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['contas-pagar', page, limit],
    queryFn: () => getContasPagar(page, limit),
  });
}

export function useProcessarPagamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: processarPagamento,
    onSuccess: () => {
      toast.success('Pagamento processado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['dre-summary'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao processar pagamento.');
    }
  });
}

export function useCriarRegistro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CriarRegistroDto) => criarRegistro(data),
    onSuccess: () => {
      toast.success('Registro financeiro criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['dre-summary'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar registro.');
    }
  });
}
