import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { necessidadesApi } from '../api/necessidades.api';
import type { FiltrosHistorico, FiltrosNecessidade } from '../types/necessidade.types';

/**
 * Necessidades mudam com cada venda, recepção e transferência — não faz sentido um
 * `staleTime` generoso como em `saude-stock`, que é um retrato do catálogo que muda
 * devagar. Aqui prefere-se buscar de novo com mais frequência; a Fase 2 (eventos por
 * websocket) substitui isto por invalidação dirigida em vez de tempo.
 */
const UM_MINUTO = 60 * 1000;

export function useNecessidades(filtros?: FiltrosNecessidade) {
  return useQuery({
    queryKey: ['necessidades', 'lista', filtros],
    queryFn: () => necessidadesApi.listar(filtros),
    staleTime: UM_MINUTO,
    // Mantém a página anterior visível enquanto a seguinte carrega — sem isto, mudar de
    // filtro faz a tabela colapsar e voltar a crescer a cada clique.
    placeholderData: (prev) => prev,
  });
}

export function useKpisNecessidades(lojaId?: string) {
  return useQuery({
    queryKey: ['necessidades', 'kpis', lojaId],
    queryFn: () => necessidadesApi.getKpis(lojaId),
    staleTime: UM_MINUTO,
  });
}

export function useDetalheNecessidade(id: string | null) {
  return useQuery({
    queryKey: ['necessidades', 'detalhe', id],
    queryFn: () => necessidadesApi.getDetalhe(id as string),
    enabled: !!id,
  });
}

/**
 * A análise da MAYRA (DT01 §14).
 *
 * Um 400 aqui significa "MAYRA não configurada neste ambiente" (ver
 * `AnalisarNecessidadesMayraUseCase`), não um erro de rede — `retry: false` evita
 * três tentativas inúteis contra uma configuração que não vai mudar durante a
 * sessão, e `PainelMayra` lê `isError` para mostrar indisponibilidade em vez de um
 * estado de carregamento eterno.
 */
export function useAnaliseMayra(lojaId?: string) {
  return useQuery({
    queryKey: ['necessidades', 'mayra-analise', lojaId],
    queryFn: () => necessidadesApi.getAnaliseMayra(lojaId),
    retry: false,
    staleTime: UM_MINUTO * 5,
  });
}

/**
 * Criar Requisição a partir da necessidade.
 *
 * O toast distingue os dois desfechos do DT01 13: uma requisição nova, ou uma já
 * existente para onde o utilizador foi encaminhado. Tratar os dois como sucesso sem
 * distinção esconderia que o duplo clique não criou uma segunda requisição.
 */
export function useCriarRequisicaoDeNecessidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      necessidadeId,
      ...dados
    }: {
      necessidadeId: string;
      quantidade?: number;
      dataNecessidade?: string;
      observacoes?: string;
    }) => necessidadesApi.criarRequisicao(necessidadeId, dados),
    onSuccess: (resultado) => {
      toast.success(
        resultado.jaExistia
          ? `Já existia a requisição ${resultado.numero}. Necessidade encaminhada para lá.`
          : `Requisição ${resultado.numero} criada.`,
      );
      queryClient.invalidateQueries({ queryKey: ['necessidades'] });
    },
    onError: (erro: any) => {
      toast.error(erro?.response?.data?.message ?? 'Não foi possível criar a requisição.');
    },
  });
}

/**
 * Solicitar uma transferência a partir da necessidade.
 *
 * Também invalida a lista de transferências: a nova aparece lá, à espera de
 * aprovação, no ecrã próprio de Transferências entre Lojas.
 */
export function useCriarTransferenciaDeNecessidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      necessidadeId,
      ...dados
    }: {
      necessidadeId: string;
      origemLojaId: string;
      quantidade?: number;
    }) => necessidadesApi.criarTransferencia(necessidadeId, dados),
    onSuccess: () => {
      toast.success('Transferência solicitada. Acompanhe-a em Transferências entre Lojas.');
      queryClient.invalidateQueries({ queryKey: ['necessidades'] });
      queryClient.invalidateQueries({ queryKey: ['transferencias'] });
    },
    onError: (erro: any) => {
      toast.error(erro?.response?.data?.message ?? 'Não foi possível solicitar a transferência.');
    },
  });
}

export function useIgnorarNecessidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ necessidadeId, motivo }: { necessidadeId: string; motivo: string }) =>
      necessidadesApi.ignorar(necessidadeId, motivo),
    onSuccess: () => {
      toast.success('Necessidade marcada como ignorada.');
      queryClient.invalidateQueries({ queryKey: ['necessidades'] });
    },
    onError: (erro: any) => {
      toast.error(erro?.response?.data?.message ?? 'Não foi possível ignorar a necessidade.');
    },
  });
}

export function useRecalcularNecessidades() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lojaId, produtoIds }: { lojaId: string; produtoIds?: string[] }) =>
      necessidadesApi.recalcular(lojaId, produtoIds),
    onSuccess: () => {
      toast.success('Necessidades reavaliadas.');
      queryClient.invalidateQueries({ queryKey: ['necessidades'] });
    },
    onError: (erro: any) => {
      toast.error(erro?.response?.data?.message ?? 'Não foi possível reavaliar.');
    },
  });
}

/** O Histórico de Necessidades como ecrã agregado — DT01 §15.3. */
export function useHistoricoNecessidades(filtros?: FiltrosHistorico) {
  return useQuery({
    queryKey: ['necessidades', 'historico', filtros],
    queryFn: () => necessidadesApi.getHistorico(filtros),
    staleTime: UM_MINUTO,
    placeholderData: (prev) => prev,
  });
}

/**
 * O Centro de Alertas — DT01 §15.4.
 *
 * `refetchInterval` de 2 minutos: é a badge do sino de notificações no cabeçalho, e
 * precisa de reflectir OCs que se tornam atrasadas com o tempo — não só por acção do
 * utilizador, como o resto do painel.
 */
export function useAlertas(lojaId?: string) {
  return useQuery({
    queryKey: ['necessidades', 'alertas', lojaId],
    queryFn: () => necessidadesApi.getAlertas(lojaId),
    staleTime: UM_MINUTO,
    refetchInterval: 2 * UM_MINUTO,
  });
}
