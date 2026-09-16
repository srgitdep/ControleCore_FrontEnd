import { api } from '@/shared/config';
import type {
  AnaliseMayra,
  CentroDeAlertas,
  DetalheNecessidade,
  FiltrosHistorico,
  FiltrosNecessidade,
  KpisNecessidades,
  ListaHistoricoNecessidades,
  ListaNecessidades,
  ResultadoCriacaoRequisicao,
} from '../types/necessidade.types';

/**
 * A fila operacional de necessidades e as suas acções — DT01.
 *
 * Nenhuma função aqui calcula nada: lê o que o motor do backend já classificou, ou
 * dispara uma acção que o backend valida outra vez no momento (DT01 6 e 13). O cliente
 * nunca decide se algo é COMPRAR ou TRANSFERIR.
 */
export const necessidadesApi = {
  /** A fila paginada, com os filtros do painel. */
  listar: async (filtros?: FiltrosNecessidade) => {
    const { data } = await api.get<ListaNecessidades>('/necessidades', {
      params: {
        ...filtros,
        recomendacao: filtros?.recomendacao?.join(','),
        urgencia: filtros?.urgencia?.join(','),
      },
    });
    return data;
  },

  /** Os KPIs do topo do painel (DT01 8). */
  getKpis: async (lojaId?: string) => {
    const { data } = await api.get<KpisNecessidades>('/necessidades/kpis', {
      params: { lojaId },
    });
    return data;
  },

  /** O Detalhe da Necessidade do DT01 11. */
  getDetalhe: async (id: string) => {
    const { data } = await api.get<DetalheNecessidade>(`/necessidades/${id}`);
    return data;
  },

  /**
   * Criar Requisição a partir da necessidade (DT01 13).
   *
   * Se já existir requisição para o produto nesta loja, o backend devolve essa em vez
   * de criar uma segunda — `jaExistia` diz qual dos dois aconteceu, para o ecrã poder
   * mostrar "requisição já existente" em vez de "requisição criada".
   */
  criarRequisicao: async (
    necessidadeId: string,
    dados?: { quantidade?: number; dataNecessidade?: string; observacoes?: string },
  ) => {
    const { data } = await api.post<ResultadoCriacaoRequisicao>(
      `/necessidades/${necessidadeId}/requisicao`,
      dados ?? {},
    );
    return data;
  },

  /**
   * Solicitar uma transferência a partir da necessidade (DT01 §11 e §15.1).
   *
   * O backend revalida a oportunidade em tempo real: a rede pode ter mudado desde
   * que o detalhe foi calculado.
   */
  criarTransferencia: async (
    necessidadeId: string,
    dados: { origemLojaId: string; quantidade?: number },
  ) => {
    const { data } = await api.post(`/necessidades/${necessidadeId}/transferencia`, dados);
    return data;
  },

  /**
   * A recomendação principal da MAYRA sobre a fila (DT01 §14).
   *
   * Pode devolver 400 quando a MAYRA não está configurada neste ambiente — o painel
   * operacional continua funcional sem ela (DT01 §6); o chamador trata isso como
   * indisponibilidade, não como erro a propagar para o utilizador.
   */
  getAnaliseMayra: async (lojaId?: string) => {
    const { data } = await api.get<AnaliseMayra>('/necessidades/mayra/analise', { params: { lojaId } });
    return data;
  },

  /** Tirar da fila sem comprar. O motivo é obrigatório (DT01 5 e 24). */
  ignorar: async (necessidadeId: string, motivo: string) => {
    const { data } = await api.post(`/necessidades/${necessidadeId}/ignorar`, { motivo });
    return data;
  },

  /** Forçar reavaliação de uma loja. Uso manual — o caminho normal é por evento. */
  recalcular: async (lojaId: string, produtoIds?: string[]) => {
    const { data } = await api.post('/necessidades/recalcular', { lojaId, produtoIds });
    return data;
  },

  /** O Histórico de Necessidades como ecrã (DT01 §15.3). */
  getHistorico: async (filtros?: FiltrosHistorico) => {
    const { data } = await api.get<ListaHistoricoNecessidades>('/necessidades/historico', {
      params: filtros,
    });
    return data;
  },

  /**
   * O Centro de Alertas (DT01 §15.4): ruptura, OC atrasada e recepção pendente.
   * Atraso de fornecedor e transporte não estão incluídos — o backend não os calcula
   * (sem módulo de logística).
   */
  getAlertas: async (lojaId?: string) => {
    const { data } = await api.get<CentroDeAlertas>('/necessidades/alertas', { params: { lojaId } });
    return data;
  },
};
