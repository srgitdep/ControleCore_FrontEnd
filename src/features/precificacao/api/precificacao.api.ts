import { api } from '@/shared/config';
import type {
  CandidatoPreco,
  CriarPoliticaPrecoPayload,
  PoliticaPreco,
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

  listarCandidatos: async (produtoId?: string) => {
    const { data } = await api.get<CandidatoPreco[]>(`${BASE}/candidatos`, {
      params: produtoId ? { produtoId } : undefined,
    });
    return data;
  },
};
