import { contaApi } from './conta.api';

export interface ProdutoFavoritado {
  id: string;
  produtoId: string;
  createdAt: string;
  produto: {
    id: string;
    nome: string;
    precoVenda: number;
    imagemUrl: string | null;
    unidadeMedida: string;
    isActive: boolean;
  };
}

const BASE = '/commerce/favoritos';

export const favoritos = {
  listar: async () => {
    const { data } = await contaApi.get<ProdutoFavoritado[]>(BASE);
    return data;
  },

  adicionar: async (produtoId: string) => {
    const { data } = await contaApi.post<ProdutoFavoritado>(BASE, { produtoId });
    return data;
  },

  remover: async (produtoId: string) => {
    const { data } = await contaApi.delete<{ ok: true }>(`${BASE}/${produtoId}`);
    return data;
  },
};
