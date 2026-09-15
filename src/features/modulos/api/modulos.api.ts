import { api } from '@/shared/config';

export interface Modulo {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string | null;
  precoMensal: number;
  ordem: number;
  isAtivo: boolean;
  createdAt: string;
}

export interface CriarModuloDto {
  codigo: string;
  nome: string;
  descricao?: string;
  precoMensal: number;
  ordem?: number;
  isAtivo?: boolean;
}

export type ActualizarModuloDto = Partial<CriarModuloDto>;

/**
 * O catálogo global de módulos — o que existe para uma empresa contratar.
 *
 * Distinto de `/empresas/modulos/catalogo` (o mesmo catálogo, filtrado a activos, para o
 * ecrã de subscrição de uma empresa) e de `/empresas/modulos/meus` (os módulos que a
 * empresa actual já tem). Este é o CRUD do catálogo em si — só faz sentido para quem
 * administra a plataforma, não para uma empresa cliente.
 */
export const modulosApi = {
  listar: async (incluirInativos = false) => {
    const { data } = await api.get<Modulo[]>('/modulos', {
      params: incluirInativos ? { inativos: true } : undefined,
    });
    return data;
  },

  obter: async (id: string) => {
    const { data } = await api.get<Modulo>(`/modulos/${id}`);
    return data;
  },

  criar: async (dto: CriarModuloDto) => {
    const { data } = await api.post<Modulo>('/modulos', dto);
    return data;
  },

  actualizar: async (id: string, dto: ActualizarModuloDto) => {
    const { data } = await api.patch<Modulo>(`/modulos/${id}`, dto);
    return data;
  },

  mudarEstado: async (id: string, isAtivo: boolean) => {
    const { data } = await api.patch<Modulo>(`/modulos/${id}/status`, { isAtivo });
    return data;
  },

  /** Recusado pelo backend se o módulo tiver assinaturas — usar «desactivar» nesse caso. */
  apagar: async (id: string) => {
    await api.delete(`/modulos/${id}`);
  },
};
