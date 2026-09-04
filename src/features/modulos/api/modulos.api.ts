import { api } from '@/shared/config';

/**
 * O catálogo de módulos da plataforma, e os módulos que cada empresa subscreve.
 *
 * ## Porque isto faltava
 *
 * O `ModuloController` tem seis rotas — criar, listar, detalhe, editar, activar/desactivar
 * e apagar — e nenhuma era chamada. As duas rotas de módulos em `/empresas`
 * (`modulos/catalogo` e `modulos/meus`) também não. As únicas ocorrências de «modulos» no
 * frontend eram âncoras `/#modulos` na página de apresentação.
 *
 * Consequência concreta: o onboarding de uma empresa enviava `modulos: []` fixo no código.
 * Nenhuma empresa criada pela aplicação subscrevia nada, e a `Assinatura` nascia sem
 * linhas — pelo que o valor da assinatura era sempre zero.
 *
 * ## O catálogo é global, não por empresa
 *
 * `Modulo` não tem `empresaId` e o `codigo` é único em toda a plataforma: é a lista do que
 * o ControlCore vende, mantida por quem o vende. É por isso que a gestão do catálogo é do
 * SUPER_ADMIN, e o que cada empresa vê é a sua subscrição.
 */

export interface Modulo {
  id: string;
  /** Único na plataforma. Identifica o módulo em código e em integrações. */
  codigo: string;
  nome: string;
  descricao: string | null;
  precoMensal: number;
  isAtivo: boolean;
  /** Ordem de apresentação no catálogo. */
  ordem: number;
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

export const modulosApi = {
  /**
   * O catálogo completo. Sem `incluirInativos`, só os que estão à venda.
   *
   * O servidor lê o parâmetro como a string `'true'`, e não como booleano — daí passá-lo
   * assim explicitamente em vez de deixar o axios serializar.
   */
  listar: async (incluirInativos = false) => {
    const { data } = await api.get<Modulo[]>('/modulos', {
      params: incluirInativos ? { inativos: 'true' } : undefined,
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

  actualizar: async (id: string, dto: Partial<CriarModuloDto>) => {
    const { data } = await api.patch<Modulo>(`/modulos/${id}`, dto);
    return data;
  },

  /**
   * Põe ou retira um módulo à venda.
   *
   * Desactivar não mexe em quem já o subscreveu — as assinaturas em vigor continuam. É a
   * diferença face a apagar, que o servidor recusa quando existem assinaturas.
   */
  alterarEstado: async (id: string, isAtivo: boolean) => {
    const { data } = await api.patch<Modulo>(`/modulos/${id}/status`, { isAtivo });
    return data;
  },

  apagar: async (id: string) => {
    const { data } = await api.delete(`/modulos/${id}`);
    return data;
  },

  /** O catálogo à venda, na forma que o onboarding usa para oferecer a escolha. */
  catalogoParaSubscricao: async () => {
    const { data } = await api.get<Modulo[]>('/empresas/modulos/catalogo');
    return data;
  },

  /**
   * Os módulos que a empresa autenticada subscreve.
   *
   * Vazio quando não há assinatura activa nem em avaliação — o que é informação, não erro.
   */
  meusModulos: async () => {
    const { data } = await api.get<Modulo[]>('/empresas/modulos/meus');
    return data;
  },
};
