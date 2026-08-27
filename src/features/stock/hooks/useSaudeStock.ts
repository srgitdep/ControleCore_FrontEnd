import { useQuery } from '@tanstack/react-query';
import { saudeApi, type FiltrosSaude } from '../api/saude.api';

/**
 * A saúde do stock corre três a quatro consultas de conjunto sobre o catálogo inteiro. Não é
 * uma consulta barata, e o valor não muda de segundo a segundo — daí um `staleTime` generoso
 * em vez do refetch por omissão.
 */
const CINCO_MINUTOS = 5 * 60 * 1000;

export function useSaudeResumo(filtros?: FiltrosSaude) {
  return useQuery({
    queryKey: ['saude-stock', 'resumo', filtros],
    queryFn: () => saudeApi.getResumo(filtros),
    staleTime: CINCO_MINUTOS,
    placeholderData: (prev) => prev,
  });
}

export function useSaudeProdutos(
  params?: FiltrosSaude & { classe?: string; page?: number; limit?: number },
) {
  return useQuery({
    queryKey: ['saude-stock', 'produtos', params],
    queryFn: () => saudeApi.getProdutos(params),
    staleTime: CINCO_MINUTOS,
    // Mantém a página anterior visível enquanto a seguinte carrega, para a tabela não
    // colapsar e voltar a crescer a cada mudança de filtro.
    placeholderData: (prev) => prev,
  });
}

export function useValidade(
  params?: FiltrosSaude & {
    estado?: string;
    produtoId?: string;
    armazemId?: string;
    page?: number;
    limit?: number;
  },
) {
  return useQuery({
    queryKey: ['saude-stock', 'validade', params],
    queryFn: () => saudeApi.getValidade(params),
    staleTime: CINCO_MINUTOS,
    placeholderData: (prev) => prev,
  });
}

/**
 * FEFO para um produto num armazém.
 *
 * `enabled` exige os três: sem armazém a pergunta não tem resposta possível — um lote existe
 * num armazém concreto, e recomendar um lote que está noutra loja daria uma instrução
 * impossível de cumprir a quem separa.
 */
export function useFefo(params: {
  produtoId?: string;
  armazemId?: string;
  quantidade?: number;
}) {
  return useQuery({
    queryKey: ['saude-stock', 'fefo', params],
    queryFn: () =>
      saudeApi.getFefo({
        produtoId: params.produtoId!,
        armazemId: params.armazemId!,
        quantidade: params.quantidade!,
      }),
    enabled: !!params.produtoId && !!params.armazemId && !!params.quantidade,
  });
}
