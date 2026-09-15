import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/shared/hooks';
import { pesquisaApi } from '../api/pesquisa.api';

/**
 * A pesquisa global do cabeçalho — DT01 §7.1.
 *
 * Debounce de 300ms: sem ele, cada tecla depois do segundo carácter dispararia um
 * pedido próprio — cinco consultas no backend por letra digitada. `enabled` com 2+
 * caracteres evita ainda os pedidos das duas primeiras letras, que nunca devolveriam
 * nada de útil (o backend também recusa abaixo disso).
 */
export function usePesquisaGlobal(termo: string) {
  const termoComDebounce = useDebounce(termo, 300);

  return useQuery({
    queryKey: ['pesquisa-global', termoComDebounce],
    queryFn: () => pesquisaApi.pesquisar(termoComDebounce),
    enabled: termoComDebounce.trim().length >= 2,
    staleTime: 30 * 1000,
  });
}
