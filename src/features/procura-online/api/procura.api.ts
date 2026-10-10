import { api } from '@/shared/config';
import type { FiltrosDaProcura, RelatorioDaProcura } from '../types/procura';

/** A procura online. A instância `api` do funcionário — nunca `contaApi` (a do cliente da loja). */
export const procuraApi = {
  /** As lojas da minha empresa. A empresa vem do token, nunca de um parâmetro. */
  daEmpresa: async (filtros: FiltrosDaProcura) => {
    const { data } = await api.get<RelatorioDaProcura>('/procura-online', {
      params: { dias: filtros.dias, ...(filtros.lojaId ? { lojaId: filtros.lojaId } : {}) },
    });
    return data;
  },

  /** A plataforma inteira — só o Super Admin. */
  doSistema: async (dias: number) => {
    const { data } = await api.get<RelatorioDaProcura>('/relatorios/procura-online/sistema', {
      params: { dias },
    });
    return data;
  },
};
