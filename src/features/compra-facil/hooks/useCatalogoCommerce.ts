import { useQuery } from '@tanstack/react-query';
import { catalogo } from '../api/catalogo.api';
import { conta } from '../api/conta.api';
import { useContaClienteStore } from '../store/useContaClienteStore';

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
  opcoes?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [CHAVE, lojaId, 'produtos', filtros],
    queryFn: () => catalogo.listarProdutos(lojaId!, filtros),
    enabled: !!lojaId && (opcoes?.enabled ?? true),
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

/** Produtos de todas as lojas — a página inicial do mercado. */
export function useProdutosMercado(
  filtros: { search?: string; categoria?: string; page?: number; limit?: number },
  opcoes?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [CHAVE, 'mercado', 'produtos', filtros],
    queryFn: () => catalogo.listarProdutosMercado(filtros),
    placeholderData: (anterior) => anterior,
    enabled: opcoes?.enabled ?? true,
  });
}

export function useCategoriasMercado() {
  return useQuery({
    queryKey: [CHAVE, 'mercado', 'categorias'],
    queryFn: () => catalogo.listarCategoriasMercado(),
    staleTime: 5 * 60 * 1000,
  });
}

/** As lojas onde a conta autenticada já comprou — só existe para quem tem sessão. */
export function useLojasCompradas() {
  const autenticado = useContaClienteStore((s) => s.autenticado);

  return useQuery({
    queryKey: [CHAVE, 'mercado', 'lojas-compradas'],
    queryFn: () => conta.lojasCompradas(),
    enabled: autenticado,
  });
}
