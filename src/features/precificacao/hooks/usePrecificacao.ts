import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { mensagemDeErro } from '@/shared/utils';
import { precificacaoApi } from '../api/precificacao.api';
import type {
  CriarPoliticaPrecoPayload,
  EstadoCandidatoPreco,
  OrigemCandidatoPreco,
  SimularPoliticaPayload,
  SimularPrecoPayload,
} from '../types';

const CHAVE_POLITICAS = 'precificacao-politicas';
const CHAVE_CANDIDATOS = 'precificacao-candidatos';
const CHAVE_HISTORICO = 'precificacao-historico';

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

export function useCandidatosPreco(
  produtoId?: string,
  estado?: EstadoCandidatoPreco,
  origem?: OrigemCandidatoPreco,
) {
  return useQuery({
    queryKey: [CHAVE_CANDIDATOS, produtoId ?? null, estado ?? null, origem ?? null],
    queryFn: () => precificacaoApi.listarCandidatos(produtoId, estado, origem),
  });
}

/** A fila de excepções: só o que espera uma decisão, pedida por alguém (manual ou MAYRA). */
export function useFilaDeExcecoes() {
  return useCandidatosPreco(undefined, 'PENDENTE');
}

/**
 * A fila da reprecificação por custo (D7-4): candidatos `origem=POLITICA`, nascidos de um
 * custo novo na recepção de mercadoria — nunca de um pedido de alguém.
 */
export function useFilaDeReprecificacao() {
  return useCandidatosPreco(undefined, 'PENDENTE', 'POLITICA');
}

export function useAprovarCandidato() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('precificacao');

  return useMutation({
    mutationFn: (id: string) => precificacaoApi.aprovarCandidato(id),
    onSuccess: () => {
      toast.success(t('mensagens.candidato_aprovado'));
      void queryClient.invalidateQueries({ queryKey: [CHAVE_CANDIDATOS] });
      void queryClient.invalidateQueries({ queryKey: [CHAVE_HISTORICO] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_aprovar'))),
  });
}

export function useRecusarCandidato() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('precificacao');

  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      precificacaoApi.recusarCandidato(id, { motivo }),
    onSuccess: () => {
      toast.success(t('mensagens.candidato_recusado'));
      void queryClient.invalidateQueries({ queryKey: [CHAVE_CANDIDATOS] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_recusar'))),
  });
}

export function useHistoricoDeProduto(produtoId?: string) {
  return useQuery({
    queryKey: [CHAVE_HISTORICO, produtoId ?? null],
    queryFn: () => precificacaoApi.historicoDoProduto(produtoId!),
    enabled: !!produtoId,
  });
}

/** «E se a margem fosse X?» sobre muitos produtos — nunca grava nada (D7-4). */
export function useSimularPolitica() {
  const { t } = useTranslation('precificacao');

  return useMutation({
    mutationFn: (payload: SimularPoliticaPayload) => precificacaoApi.simularPolitica(payload),
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_simular'))),
  });
}
