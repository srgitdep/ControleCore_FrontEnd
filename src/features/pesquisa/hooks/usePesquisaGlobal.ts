import { useQuery } from '@tanstack/react-query';
import { pesquisaApi } from '../api/pesquisa.api';

/**
 * A pesquisa global do cabeçalho — DT01 §7.1.
 *
 * `enabled` só com 2+ caracteres, tal como o backend recusa: evita um pedido por
 * cada tecla nas duas primeiras letras, que nunca devolveriam nada de útil.
 */
export function usePesquisaGlobal(termo: string) {
  return useQuery({
    queryKey: ['pesquisa-global', termo],
    queryFn: () => pesquisaApi.pesquisar(termo),
    enabled: termo.trim().length >= 2,
    staleTime: 30 * 1000,
  });
}
