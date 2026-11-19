import { api } from '@/shared/config';

export type AccaoPermissao = 'read' | 'write' | 'delete' | 'manage';

/** Uma linha da matriz de permissões, tal como o servidor a usa para autorizar. */
export interface RecursoDePermissao {
  /** O `resource` da permissão e a chave de `permissoes.recurso.<id>` (namespace `shell`). */
  id: string;
  /** A área em que aparece (`permissoes.grupo.<grupo>`). */
  grupo: string;
  /** Só as acções que existem para este recurso; as outras células ficam vazias. */
  acoes: AccaoPermissao[];
}

/** Um perfil de acesso: de sistema (comum a todas as empresas, só da SRG) ou da empresa. */
export interface PerfilDeAcesso {
  id: string;
  nome: string;
  descricao?: string | null;
  isSystem: boolean;
  empresaId: string | null;
}

export interface CriarPerfilPayload {
  nome: string;
  descricao?: string;
  /** Um perfil cujas permissões o novo copia. Sem valor, nasce sem permissões. */
  copiarDe?: string;
}

export const permissoesApi = {
  listarPerfis: async () => {
    const { data } = await api.get<PerfilDeAcesso[]>('/perfis');
    return data;
  },

  criarPerfil: async (payload: CriarPerfilPayload) => {
    const { data } = await api.post<PerfilDeAcesso>('/perfis', payload);
    return data;
  },

  renomearPerfil: async (id: string, payload: { nome?: string; descricao?: string }) => {
    const { data } = await api.patch<PerfilDeAcesso>(`/perfis/${id}`, payload);
    return data;
  },

  apagarPerfil: async (id: string) => {
    await api.delete(`/perfis/${id}`);
  },

  /**
   * O catálogo vem do servidor e não de uma lista no frontend: era essa lista própria que
   * tinha divergido dos nomes que os controladores pedem, e deixava 38 permissões sem
   * nenhuma caixa para as marcar.
   */
  listarRecursos: async () => {
    const { data } = await api.get<RecursoDePermissao[]>('/perfis/recursos');
    return data;
  },
};
