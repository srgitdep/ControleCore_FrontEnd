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

export const permissoesApi = {
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
