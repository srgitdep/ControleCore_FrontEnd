import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EVENTO_ASSINATURA_BLOQUEADA } from '@/shared/config';
import { getMinhaAssinatura } from '../api/assinatura.api';

/**
 * O estado da assinatura da empresa de quem está autenticado.
 *
 * De 5 em 5 minutos, e também logo que algum pedido responda 403 «assinatura bloqueada»: a
 * tarefa de expiração corre de madrugada, mas a plataforma pode suspender a meio do dia, e
 * sem isto a aplicação continuava a mostrar ecrãs que já só respondem erros.
 */
export function useMinhaAssinatura(activo: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!activo) return;
    const refrescar = () => queryClient.invalidateQueries({ queryKey: ['minha-assinatura'] });
    window.addEventListener(EVENTO_ASSINATURA_BLOQUEADA, refrescar);
    return () => window.removeEventListener(EVENTO_ASSINATURA_BLOQUEADA, refrescar);
  }, [activo, queryClient]);

  return useQuery({
    queryKey: ['minha-assinatura'],
    queryFn: getMinhaAssinatura,
    enabled: activo,
    refetchInterval: 5 * 60 * 1000,
    // Um erro aqui não pode deitar a aplicação abaixo: sem resposta, não se mostra aviso.
    retry: 1,
  });
}
