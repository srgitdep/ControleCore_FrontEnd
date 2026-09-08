import { api } from '@/shared/config';

/**
 * Localizações físicas dentro de um armazém (§15, §16).
 *
 * A profundidade é livre: quem tem uma arrecadação cria duas prateleiras, quem tem um
 * entreposto cria zona, corredor, estante, prateleira e posição. Localizações que ninguém
 * mantém são piores do que a ausência delas — o sistema diz B-04-03-02-08 e o produto está
 * noutro sítio.
 */

export interface Localizacao {
  id: string;
  armazemId: string;
  codigo: string;
  nome: string | null;
  tipo: string | null;
  paiId: string | null;
  /** O endereço completo: «B / 04 / 03». Calculado no servidor. */
  caminho: string;
  isActive: boolean;
}

/** Um nó da árvore, como o servidor a devolve montada. */
export interface NoLocalizacao extends Localizacao {
  filhos: NoLocalizacao[];
}

export interface ArvoreLocalizacoes {
  arvore: NoLocalizacao[];
  total: number;
}

export interface CriarLocalizacaoPayload {
  codigo: string;
  nome?: string;
  tipo?: string;
  /** Omitir cria um nível de topo. */
  paiId?: string;
}

export interface ActualizarLocalizacaoPayload {
  codigo?: string;
  nome?: string;
  tipo?: string;
  /**
   * `null` move para o topo; **omitir mantém o pai**.
   *
   * Sem essa distinção, renomear moveria o nó para a raiz sem ninguém pedir.
   */
  paiId?: string | null;
}

export const localizacoesApi = {
  listar: async (armazemId: string, incluirInactivas = false) => {
    const { data } = await api.get<ArvoreLocalizacoes>(`/armazens/${armazemId}/localizacoes`, {
      params: incluirInactivas ? { incluirInactivas: true } : undefined,
    });
    return data;
  },

  criar: async (armazemId: string, payload: CriarLocalizacaoPayload) => {
    const { data } = await api.post<Localizacao>(
      `/armazens/${armazemId}/localizacoes`,
      payload,
    );
    return data;
  },

  /** Renomear e mover são a mesma operação: ambas reescrevem o caminho das descendentes. */
  actualizar: async (id: string, payload: ActualizarLocalizacaoPayload) => {
    const { data } = await api.patch<Localizacao & { descendentesReescritos: number }>(
      `/armazens/localizacoes/${id}`,
      payload,
    );
    return data;
  },

  /** Desactiva em vez de apagar. Recusa se ainda houver mercadoria na posição ou abaixo. */
  desactivar: async (id: string) => {
    const { data } = await api.delete<Localizacao>(`/armazens/localizacoes/${id}`);
    return data;
  },
};
