import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import i18n from '@/i18n';
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
    toast.error(erro?.response?.data?.message || i18n.t('stock:operacao.erro_generico'));

  const atribuir = useMutation({
    mutationFn: (payload: { localizacaoId: string; quantidade: number }) =>
      distribuicaoApi.atribuir(stockId!, payload),
    onSuccess: (d) => {
      invalidar();
      toast.success(
        d.resumo.porLocalizar > 0
          ? i18n.t('stock:distribuicao.actualizada_faltam', { count: d.resumo.porLocalizar })
          : i18n.t('stock:distribuicao.actualizada_localizado'),
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
      toast.success(i18n.t('stock:distribuicao.movida'));
    },
    onError: aoFalhar,
  });

  return { atribuir, mover, aDecorrer: atribuir.isPending || mover.isPending };
}
