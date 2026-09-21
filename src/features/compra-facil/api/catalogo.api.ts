import axios from 'axios';
import { api } from '@/shared/config';

/**
 * O catálogo público do Compra Fácil: instância própria, sem credenciais.
 *
 * Mesmo padrão de `mercado.api.ts` — um visitante sem conta tem de conseguir folhear a
 * loja antes de decidir criar conta, e a instância `api` partilhada atiraria qualquer
 * 401 para o fluxo de sessão do ControlCore, que não existe aqui.
 */
const catalogoApi = axios.create({
  baseURL: api.defaults.baseURL,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

export interface LojaCommerce {
  id: string;
  nome: string;
  endereco: string | null;
  cidade: string | null;
}

export interface ProdutoLoja {
  id: string;
  nome: string;
  descricao: string | null;
  precoVenda: number;
  taxaIva: number;
  unidadeMedida: string;
  isWeighable: boolean;
  categoria: { id: string; nome: string } | null;
  imagemUrl: string | null;
  imagens: { url: string; ordem: number; isPrincipal: boolean }[];
  quantidadeDisponivel: number;
  disponivel: boolean;
}

export interface PaginaProdutos {
  data: ProdutoLoja[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

/** Um cartão do mercado: o mesmo `ProdutoLoja`, mais a loja concreta para onde o clique leva. */
export interface ProdutoMercado extends ProdutoLoja {
  lojaId: string;
  lojaNome: string;
}

export interface PaginaProdutosMercado {
  data: ProdutoMercado[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const catalogo = {
  listarLojas: async () => {
    const { data } = await catalogoApi.get<LojaCommerce[]>('/commerce/lojas');
    return data;
  },

  listarProdutos: async (
    lojaId: string,
    filtros?: { search?: string; categoryId?: string; page?: number; limit?: number },
  ) => {
    const { data } = await catalogoApi.get<PaginaProdutos>(
      `/commerce/lojas/${lojaId}/produtos`,
      { params: filtros },
    );
    return data;
  },

  obterProduto: async (lojaId: string, produtoId: string) => {
    const { data } = await catalogoApi.get<ProdutoLoja>(
      `/commerce/lojas/${lojaId}/produtos/${produtoId}`,
    );
    return data;
  },

  /** Produtos de todas as lojas — a página inicial do mercado. */
  listarProdutosMercado: async (filtros?: {
    search?: string;
    categoria?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await catalogoApi.get<PaginaProdutosMercado>('/commerce/produtos', {
      params: filtros,
    });
    return data;
  },

  /** Nomes de categoria distintos entre todas as lojas, para o filtro do mercado. */
  listarCategoriasMercado: async () => {
    const { data } = await catalogoApi.get<string[]>('/commerce/categorias');
    return data;
  },
};
