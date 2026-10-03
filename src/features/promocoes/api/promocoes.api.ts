import { api } from '@/shared/config';
import type { CriarPromocaoPayload, Promocao, PromocaoComRisco } from '../types';

const BASE = '/promocoes';

export const promocoesApi = {
  listar: async () => {
    const { data } = await api.get<Promocao[]>(BASE);
    return data;
  },

  criar: async (payload: CriarPromocaoPayload) => {
    const { data } = await api.post<PromocaoComRisco>(BASE, payload);
    return data;
  },

  cancelar: async (id: string) => {
    await api.delete(`${BASE}/${id}`);
  },
};
