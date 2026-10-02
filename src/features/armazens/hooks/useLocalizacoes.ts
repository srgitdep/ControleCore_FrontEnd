import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import i18n from '@/i18n';
import {
  localizacoesApi,
  type ActualizarLocalizacaoPayload,
  type CriarLocalizacaoPayload,
} from '../api/localizacoes.api';

export function useLocalizacoes(armazemId: string | undefined, incluirInactivas = false) {
  return useQuery({
    queryKey: ['localizacoes', armazemId, incluirInactivas],
    queryFn: () => localizacoesApi.listar(armazemId!, incluirInactivas),
    enabled: !!armazemId,
  });
}

export function useLocalizacaoMutations(armazemId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['localizacoes', armazemId] });
    // A distribuição do stock mostra o caminho de cada posição. Renomear uma zona reescreve
    // o caminho de tudo o que está abaixo, e sem esta invalidação o ecrã do stock continuaria
    // a mostrar o endereço antigo — a mandar alguém procurar numa prateleira que mudou de nome.
    queryClient.invalidateQueries({ queryKey: ['distribuicao-stock'] });
    queryClient.invalidateQueries({ queryKey: ['onde-esta'] });
  };

  // A mensagem do servidor é a que interessa: diz que já existe «B» neste nível e onde, ou
  // quantas unidades impedem a desactivação. Trocá-la por «ocorreu um erro» apagaria o que
  // resolve o problema.
  const aoFalhar = (erro: any) =>
    toast.error(erro?.response?.data?.message || i18n.t('armazens:hooks.erro_operacao'));

  const criar = useMutation({
    mutationFn: (payload: CriarLocalizacaoPayload) => localizacoesApi.criar(armazemId!, payload),
    onSuccess: (l) => {
      invalidar();
      toast.success(i18n.t('armazens:hooks.criada', { caminho: l.caminho }));
    },
    onError: aoFalhar,
  });

  const actualizar = useMutation({
    mutationFn: ({ id, ...payload }: ActualizarLocalizacaoPayload & { id: string }) =>
      localizacoesApi.actualizar(id, payload),
    onSuccess: (l) => {
      invalidar();
      toast.success(
        l.descendentesReescritos > 0
          ? i18n.t('armazens:hooks.actualizada_com_descendentes', {
              caminho: l.caminho,
              count: l.descendentesReescritos,
            })
          : i18n.t('armazens:hooks.actualizada', { caminho: l.caminho }),
      );
    },
    onError: aoFalhar,
  });

  const desactivar = useMutation({
    mutationFn: (id: string) => localizacoesApi.desactivar(id),
    onSuccess: (l) => {
      invalidar();
      toast.success(i18n.t('armazens:hooks.desactivada', { caminho: l.caminho }));
    },
    onError: aoFalhar,
  });

  return {
    criar,
    actualizar,
    desactivar,
    aDecorrer: criar.isPending || actualizar.isPending || desactivar.isPending,
  };
}
