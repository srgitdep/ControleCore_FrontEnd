import { api } from '@/shared/config';
import type {
  CandidatoPreco,
  CriarPoliticaPrecoPayload,
  EstadoCandidatoPreco,
  PoliticaPreco,
  PrecoVersaoHistorico,
  RecusarPrecoPayload,
  SimularPrecoPayload,
} from '../types';

const BASE = '/precificacao';

export const precificacaoApi = {
  listarPoliticas: async () => {
    const { data } = await api.get<PoliticaPreco[]>(`${BASE}/politicas`);
    return data;
  },

  criarPolitica: async (payload: CriarPoliticaPrecoPayload) => {
    const { data } = await api.post<PoliticaPreco>(`${BASE}/politicas`, payload);
    return data;
  },

  simular: async (payload: SimularPrecoPayload) => {
    const { data } = await api.post<CandidatoPreco>(`${BASE}/simular`, payload);
    return data;
  },

  listarCandidatos: async (produtoId?: string, estado?: EstadoCandidatoPreco) => {
    const { data } = await api.get<CandidatoPreco[]>(`${BASE}/candidatos`, {
      params: { produtoId, estado },
    });
    return data;
  },

  aprovarCandidato: async (id: string) => {
    const { data } = await api.post<unknown>(`${BASE}/candidatos/${id}/aprovar`);
    return data;
  },

  recusarCandidato: async (id: string, payload: RecusarPrecoPayload) => {
    const { data } = await api.post<CandidatoPreco>(`${BASE}/candidatos/${id}/recusar`, payload);
    return data;
  },

  historicoDoProduto: async (produtoId: string) => {
    const { data } = await api.get<PrecoVersaoHistorico[]>(
      `${BASE}/produtos/${produtoId}/historico`,
    );
    return data;
  },
};
