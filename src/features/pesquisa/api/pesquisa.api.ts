import { api } from '@/shared/config';
import type { ResultadosPesquisaGlobal } from '../types/pesquisa.types';

export const pesquisaApi = {
  /** A pesquisa global do cabeçalho (DT01 §7.1). Não altera nenhum outro filtro. */
  pesquisar: async (termo: string) => {
    const { data } = await api.get<ResultadosPesquisaGlobal>('/pesquisa', { params: { q: termo } });
    return data;
  },
};
