import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import i18n from '@/i18n';
import { mensagemDeErro } from '@/shared/utils';
import { definirPrecoVendaLoja, getLojas, removerPrecoVendaLoja, type Armazem } from '../api/lojas.api';

export interface ArmazemComLoja extends Armazem {
  lojaNome: string;
  /** «Armazém Central (Loja do Centro)» — o nome sozinho é ambíguo entre lojas. */
  etiqueta: string;
}

/**
 * Todos os armazéns da empresa, achatados e com o nome da loja.
 *
 * Existe porque `GET /armazens` (listar todos) não existe no backend — só
 * `GET /armazens/loja/:lojaId`. O contorno é `GET /lojas`, que já devolve
 * `armazens` incluídos, e era o que a `ArmazensPage` fazia à mão com `useState` e
 * `useEffect`.
 *
 * Passa a hook para os três ecrãs que precisam de um selector de armazém (criação de
 * produto, recepção de mercadoria, detalhes de armazém) não repetirem o achatamento —
 * e para a lista ficar em cache, em vez de ser buscada a cada abertura de modal.
 *
 * Por omissão devolve só os activos: um armazém desactivado não aceita mercadoria, e
 * oferecê-lo num selector levaria a um erro do servidor depois de preencher o resto.
 */
export function useArmazens(opcoes?: { incluirInactivos?: boolean }) {
  const incluirInactivos = opcoes?.incluirInactivos ?? false;

  const query = useQuery({
    queryKey: ['armazens', { incluirInactivos }],
    queryFn: async (): Promise<ArmazemComLoja[]> => {
      const lojas = await getLojas();

      return (Array.isArray(lojas) ? lojas : [])
        .flatMap((loja: any) =>
          ((loja.armazens ?? []) as Armazem[]).map((a) => ({
            ...a,
            lojaNome: loja.nome,
            etiqueta: `${a.nome} (${loja.nome})`,
          })),
        )
        .filter((a: ArmazemComLoja) => incluirInactivos || a.isActive)
        // Ponto de venda primeiro: é o destino mais frequente de uma entrada.
        .sort((a: ArmazemComLoja, b: ArmazemComLoja) => {
          const vendaA = a.tipo?.toUpperCase() === 'VENDA' ? 0 : 1;
          const vendaB = b.tipo?.toUpperCase() === 'VENDA' ? 0 : 1;
          return vendaA !== vendaB ? vendaA - vendaB : a.etiqueta.localeCompare(b.etiqueta);
        });
    },
    // Os armazéns mudam raramente — não vale um pedido por cada abertura de modal.
    staleTime: 5 * 60 * 1000,
  });

  return {
    armazens: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

/** Define ou remove o preço de venda do produto na loja de um armazém (ver `ArmazemDetailsModal`). */
export function usePrecoVendaLoja(armazemId: string) {
  const queryClient = useQueryClient();

  const invalidar = () => {
    // 'armazem-stock' é a chave que ArmazemDetailsModal usa para ler as posições.
    queryClient.invalidateQueries({ queryKey: ['armazem-stock', armazemId] });
  };

  const definir = useMutation({
    mutationFn: ({ produtoId, preco }: { produtoId: string; preco: number }) =>
      definirPrecoVendaLoja(armazemId, produtoId, preco),
    onSuccess: () => {
      toast.success(i18n.t('armazens:detalhe.preco_venda_actualizado'));
      invalidar();
    },
    onError: (erro: unknown) => toast.error(mensagemDeErro(erro, i18n.t('armazens:detalhe.erro_preco_venda'))),
  });

  const remover = useMutation({
    mutationFn: (produtoId: string) => removerPrecoVendaLoja(armazemId, produtoId),
    onSuccess: () => {
      toast.success(i18n.t('armazens:detalhe.preco_venda_removido'));
      invalidar();
    },
    onError: (erro: unknown) => toast.error(mensagemDeErro(erro, i18n.t('armazens:detalhe.erro_preco_venda'))),
  });

  return { definir, remover };
}
