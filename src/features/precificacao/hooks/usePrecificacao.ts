import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { mensagemDeErro } from '@/shared/utils';
import { precificacaoApi } from '../api/precificacao.api';
import type { CriarPoliticaPrecoPayload, SimularPrecoPayload } from '../types';

const CHAVE_POLITICAS = 'precificacao-politicas';
const CHAVE_CANDIDATOS = 'precificacao-candidatos';

export function usePoliticasPreco() {
  return useQuery({
    queryKey: [CHAVE_POLITICAS],
    queryFn: () => precificacaoApi.listarPoliticas(),
  });
}

export function useCriarPoliticaPreco() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('precificacao');

  return useMutation({
    mutationFn: (payload: CriarPoliticaPrecoPayload) =>
      precificacaoApi.criarPolitica(payload),
    onSuccess: () => {
      toast.success(t('mensagens.politica_criada'));
      void queryClient.invalidateQueries({ queryKey: [CHAVE_POLITICAS] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_criar_politica'))),
  });
}

export function useSimularPreco() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('precificacao');

  return useMutation({
    mutationFn: (payload: SimularPrecoPayload) => precificacaoApi.simular(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [CHAVE_CANDIDATOS] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_simular'))),
  });
}

export function useCandidatosPreco(produtoId?: string) {
  return useQuery({
    queryKey: [CHAVE_CANDIDATOS, produtoId ?? null],
    queryFn: () => precificacaoApi.listarCandidatos(produtoId),
  });
}
