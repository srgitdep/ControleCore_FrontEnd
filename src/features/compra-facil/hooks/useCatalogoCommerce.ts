import { useQuery } from '@tanstack/react-query';
import { catalogo } from '../api/catalogo.api';

/** Prefixo comum de chave — nenhuma outra feature usa `['loja', ...]`. */
const CHAVE = 'loja';

export function useLojasCommerce() {
  return useQuery({
    queryKey: [CHAVE, 'lojas'],
    queryFn: () => catalogo.listarLojas(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProdutosLoja(
  lojaId: string | undefined,
  filtros: { search?: string; categoryId?: string; page?: number; limit?: number },
) {
  return useQuery({
    queryKey: [CHAVE, lojaId, 'produtos', filtros],
    queryFn: () => catalogo.listarProdutos(lojaId!, filtros),
    enabled: !!lojaId,
    placeholderData: (anterior) => anterior,
  });
}

export function useProdutoLoja(lojaId: string | undefined, produtoId: string | undefined) {
  return useQuery({
    queryKey: [CHAVE, lojaId, 'produto', produtoId],
    queryFn: () => catalogo.obterProduto(lojaId!, produtoId!),
    enabled: !!lojaId && !!produtoId,
  });
}
