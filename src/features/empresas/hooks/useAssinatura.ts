import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alterarAssinatura, getAssinatura, getRelatorioExpiracao, registarPagamento } from '../api/assinatura.api';
import type { AlterarAssinaturaPayload, RegistarPagamentoPayload } from '../types/assinatura';

export function useAssinatura(empresaId: string) {
  return useQuery({
    queryKey: ['assinatura', empresaId],
    queryFn: () => getAssinatura(empresaId),
  });
}

/**
 * Alterar e pagar devolvem a assinatura já actualizada: entra directamente na cache. Os
 * detalhes da empresa (que também mostram a assinatura) e o relatório refrescam-se.
 */
export function useGerirAssinatura(empresaId: string) {
  const queryClient = useQueryClient();
  const depois = (resposta: Awaited<ReturnType<typeof getAssinatura>>) => {
    queryClient.setQueryData(['assinatura', empresaId], resposta);
    queryClient.invalidateQueries({ queryKey: ['empresa', empresaId] });
    queryClient.invalidateQueries({ queryKey: ['relatorio-expiracao'] });
  };
  return {
    alterar: useMutation({
      mutationFn: (payload: AlterarAssinaturaPayload) => alterarAssinatura(empresaId, payload),
      onSuccess: depois,
    }),
    pagar: useMutation({
      mutationFn: (payload: RegistarPagamentoPayload) => registarPagamento(empresaId, payload),
      onSuccess: depois,
    }),
  };
}

export function useRelatorioExpiracao(activo: boolean) {
  return useQuery({
    queryKey: ['relatorio-expiracao'],
    queryFn: getRelatorioExpiracao,
    enabled: activo,
  });
}
