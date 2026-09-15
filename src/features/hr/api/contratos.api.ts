import { api } from '@/shared/config';

export type EstadoContrato = 'ATIVO' | 'SUSPENSO' | 'TERMINADO';

export interface Contrato {
  id: string;
  userId: string;
  cargo: string;
  salarioBase: number;
  dataInicio: string;
  dataFim?: string | null;
  estado: EstadoContrato;
  observacoes?: string | null;
  createdAt: string;
}

export interface CriarContratoDto {
  userId: string;
  cargo: string;
  salarioBase: number;
  dataInicio: string;
  dataFim?: string;
  observacoes?: string;
}

/**
 * Contratos de trabalho.
 *
 * ## Criar é renovar
 *
 * Não há um endpoint de «terminar contrato» — criar um contrato novo para o mesmo
 * funcionário fecha automaticamente o anterior (o backend marca-o `TERMINADO` com
 * `dataFim` de hoje). Um funcionário só tem um contrato `ATIVO` de cada vez.
 */
export const contratosApi = {
  criar: async (dto: CriarContratoDto) => {
    const { data } = await api.post<Contrato>('/rh/contratos', dto);
    return data;
  },

  /** `null` quando o funcionário não tem contrato activo — o backend devolve 404. */
  obterAtivo: async (userId: string): Promise<Contrato | null> => {
    try {
      const { data } = await api.get<Contrato>(`/rh/contratos/funcionario/${userId}/ativo`);
      return data;
    } catch (error: any) {
      if (error?.response?.status === 404) return null;
      throw error;
    }
  },

  /** Todos os contratos do funcionário — activos e terminados, mais recente primeiro. */
  listarHistorico: async (userId: string) => {
    const { data } = await api.get<Contrato[]>(`/rh/contratos/funcionario/${userId}/historico`);
    return data;
  },
};
