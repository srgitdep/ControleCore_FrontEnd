import { contaApi } from './conta.api';

export interface ProdutoFavoritado {
  id: string;
  produtoId: string;
  createdAt: string;
  produto: {
    id: string;
    nome: string;
    precoVenda: number;
    /** O que o cliente paga: preço mais IVA. */
    precoComIva: number;
    imagemUrl: string | null;
    unidadeMedida: string;
    isActive: boolean;
  };
}

const BASE = '/commerce/favoritos';

export const favoritos = {
  /** Com `lojaId` só vêm os produtos da empresa dessa loja — o que se pode comprar nela. */
  listar: async (lojaId?: string) => {
    const { data } = await contaApi.get<ProdutoFavoritado[]>(BASE, {
      params: lojaId ? { lojaId } : undefined,
    });
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
