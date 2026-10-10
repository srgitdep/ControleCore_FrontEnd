import { useQuery } from '@tanstack/react-query';
import { procuraApi } from '../api/procura.api';
import type { FiltrosDaProcura } from '../types/procura';

const CHAVE = 'procura-online';

/**
 * O relatório de procura das lojas da empresa. Os factos só mudam quando há pedidos novos e o
 * varrimento corre de 10 em 10 minutos: não vale a pena voltar a perguntar mais do que isso.
 */
export function useProcura(filtros: FiltrosDaProcura) {
  return useQuery({
    queryKey: [CHAVE, 'empresa', filtros],
    queryFn: () => procuraApi.daEmpresa(filtros),
    staleTime: 60_000,
    placeholderData: (anterior) => anterior,
  });
}

export function useProcuraSistema(dias: number) {
  return useQuery({
    queryKey: [CHAVE, 'sistema', dias],
    queryFn: () => procuraApi.doSistema(dias),
    staleTime: 60_000,
    placeholderData: (anterior) => anterior,
  });
}
