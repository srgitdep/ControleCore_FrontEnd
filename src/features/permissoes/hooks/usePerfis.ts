import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { mensagemDeErro } from '@/shared/utils';
import { permissoesApi, type CriarPerfilPayload } from '../api/permissoes.api';

export const CHAVE_PERFIS = ['perfis'] as const;

/** Os perfis que esta empresa pode usar: os de sistema e os seus. */
export function usePerfis() {
  return useQuery({
    queryKey: CHAVE_PERFIS,
    queryFn: () => permissoesApi.listarPerfis(),
  });
}

export function useCriarPerfil() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('shell');

  return useMutation({
    mutationFn: (payload: CriarPerfilPayload) => permissoesApi.criarPerfil(payload),
    onSuccess: () => {
      toast.success(t('permissoes.gerir.criado'));
      void queryClient.invalidateQueries({ queryKey: CHAVE_PERFIS });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('permissoes.gerir.erro_criar'))),
  });
}

export function useRenomearPerfil() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('shell');

  return useMutation({
    mutationFn: ({ id, nome }: { id: string; nome: string }) =>
      permissoesApi.renomearPerfil(id, { nome }),
    onSuccess: () => {
      toast.success(t('permissoes.gerir.renomeado'));
      void queryClient.invalidateQueries({ queryKey: CHAVE_PERFIS });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('permissoes.gerir.erro_renomear'))),
  });
}

export function useApagarPerfil() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('shell');

  return useMutation({
    mutationFn: (id: string) => permissoesApi.apagarPerfil(id),
    onSuccess: () => {
      toast.success(t('permissoes.gerir.apagado'));
      void queryClient.invalidateQueries({ queryKey: CHAVE_PERFIS });
    },
    // O servidor diz a quantos utilizadores o perfil está atribuído quando o recusa.
    onError: (erro) => toast.error(mensagemDeErro(erro, t('permissoes.gerir.erro_apagar'))),
  });
}
