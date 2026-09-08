import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { distribuicaoApi } from '../api/distribuicao.api';

export function useDistribuicao(stockId: string | undefined) {
  return useQuery({
    queryKey: ['distribuicao-stock', stockId],
    queryFn: () => distribuicaoApi.obter(stockId!),
    enabled: !!stockId,
  });
}

export function useOndeEsta(produtoId: string | undefined) {
  return useQuery({
    queryKey: ['onde-esta', produtoId],
    queryFn: () => distribuicaoApi.ondeEsta(produtoId!),
    enabled: !!produtoId,
  });
}

export function useDistribuicaoMutations(stockId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['distribuicao-stock', stockId] });
    queryClient.invalidateQueries({ queryKey: ['onde-esta'] });
    // A listagem de stock não muda de saldo com isto — a mercadoria não sai do armazém —
    // mas o número de posições ocupadas é informação que outras vistas mostram.
    queryClient.invalidateQueries({ queryKey: ['armazem-stock'] });
  };

  // A mensagem do servidor diz quanto cabe e porquê: «só cabem 80 nesta posição, o saldo é
  // 100 e 20 já estão atribuídas a outras». Trocá-la por «ocorreu um erro» apagaria o número
  // que a pessoa precisa de escrever a seguir.
  const aoFalhar = (erro: any) =>
    toast.error(erro?.response?.data?.message || 'Não foi possível concluir a operação.');

  const atribuir = useMutation({
    mutationFn: (payload: { localizacaoId: string; quantidade: number }) =>
      distribuicaoApi.atribuir(stockId!, payload),
    onSuccess: (d) => {
      invalidar();
      toast.success(
        d.resumo.porLocalizar > 0
          ? `Posição actualizada. Faltam localizar ${d.resumo.porLocalizar} unidades.`
          : 'Posição actualizada. Todo o saldo está localizado.',
      );
    },
    onError: aoFalhar,
  });

  const mover = useMutation({
    mutationFn: (payload: {
      deLocalizacaoId: string;
      paraLocalizacaoId: string;
      quantidade: number;
      motivo?: string;
    }) => distribuicaoApi.mover(stockId!, payload),
    onSuccess: () => {
      invalidar();
      toast.success('Mercadoria movida entre posições.');
    },
    onError: aoFalhar,
  });

  return { atribuir, mover, aDecorrer: atribuir.isPending || mover.isPending };
}
