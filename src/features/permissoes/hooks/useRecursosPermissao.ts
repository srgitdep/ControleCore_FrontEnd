import { useQuery } from '@tanstack/react-query';
import { permissoesApi } from '../api/permissoes.api';

/** O catálogo só muda com um deploy do servidor: não há razão para o voltar a pedir. */
export function useRecursosPermissao() {
  return useQuery({
    queryKey: ['permissoes-recursos'],
    queryFn: () => permissoesApi.listarRecursos(),
    staleTime: Infinity,
  });
}
