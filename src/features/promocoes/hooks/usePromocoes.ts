import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { mensagemDeErro } from '@/shared/utils';
import { promocoesApi } from '../api/promocoes.api';
import type { CriarPromocaoPayload } from '../types';

const CHAVE = 'promocoes';

export function usePromocoes() {
  return useQuery({
    queryKey: [CHAVE],
    queryFn: () => promocoesApi.listar(),
  });
}

export function useCriarPromocao() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('promocoes');

  return useMutation({
    mutationFn: (payload: CriarPromocaoPayload) => promocoesApi.criar(payload),
    onSuccess: () => {
      toast.success(t('mensagens.criada'));
      void queryClient.invalidateQueries({ queryKey: [CHAVE] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_criar'))),
  });
}

export function useCancelarPromocao() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('promocoes');

  return useMutation({
    mutationFn: (id: string) => promocoesApi.cancelar(id),
    onSuccess: () => {
      toast.success(t('mensagens.cancelada'));
      void queryClient.invalidateQueries({ queryKey: [CHAVE] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_cancelar'))),
  });
}
