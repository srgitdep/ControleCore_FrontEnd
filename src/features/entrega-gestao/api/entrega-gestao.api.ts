import { api } from '@/shared/config';
import type {
  ActualizarConfiguracaoPayload,
  ActualizarZonaPayload,
  ConfiguracaoEntrega,
  CriarZonaPayload,
  ZonaEntrega,
} from '../types';

/** A instância `api` do funcionário — nunca `contaApi`, que é a do cliente final. */
export const entregaGestaoApi = {
  listarZonas: async (lojaId?: string) => {
    const { data } = await api.get<ZonaEntrega[]>('/entregas/zonas', { params: { lojaId } });
    return data;
  },

  criarZona: async (payload: CriarZonaPayload) => {
    const { data } = await api.post<ZonaEntrega>('/entregas/zonas', payload);
    return data;
  },

  actualizarZona: async (id: string, payload: ActualizarZonaPayload) => {
    const { data } = await api.patch<ZonaEntrega>(`/entregas/zonas/${id}`, payload);
    return data;
  },

  obterConfiguracao: async () => {
    const { data } = await api.get<ConfiguracaoEntrega>('/entregas/configuracao');
    return data;
  },

  actualizarConfiguracao: async (payload: ActualizarConfiguracaoPayload) => {
    const { data } = await api.patch<ConfiguracaoEntrega>('/entregas/configuracao', payload);
    return data;
  },
};
