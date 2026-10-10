import { useQuery } from '@tanstack/react-query';
import { conta } from '../api/conta.api';
import { useContaClienteStore } from '../store/useContaClienteStore';

/**
 * Se a primeira compra nesta loja exige aceitar a partilha de dados (nome, telefone e e-mail) com a
 * empresa dela. Desligado sem sessão. Sem `staleTime` de propósito: depois de comprar, a resposta
 * passa a `false` e o aviso não pode voltar a aparecer por causa de uma cache velha.
 */
export function usePartilhaDados(lojaId: string | undefined) {
  const autenticado = useContaClienteStore((s) => s.autenticado);

  return useQuery({
    queryKey: ['loja', 'partilha', lojaId],
    queryFn: () => conta.partilha(lojaId!),
    enabled: autenticado && !!lojaId,
  });
}
