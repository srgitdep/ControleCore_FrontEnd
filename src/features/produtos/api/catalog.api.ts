import { api } from '@/shared/config';
import type { Product, Category } from '@/features/produtos';

/**
 * O que se envia ao criar um produto.
 *
 * Explícito em vez de `Partial<Product>` porque a criação aceita três campos que o
 * produto não tem: o armazém onde dar entrada e as quantidades iniciais. Vivem no
 * `Stock`, não no `Produto`.
 *
 * O `ValidationPipe` do backend corre com `forbidNonWhitelisted`, pelo que um campo a
 * mais faz o pedido falhar inteiro. Tipar aqui apanha isso na compilação em vez de em
 * produção — o hook usava `data: any` e deixava passar qualquer coisa.
 */
export interface CreateProductPayload extends Partial<Product> {
  /** Armazém onde dar entrada do stock inicial. Exige os dois campos seguintes. */
  armazemId?: string;
  quantidadeInicial?: number;
  /** Ponto de reposição neste armazém. Zero significa «sem mínimo definido». */
  stockMinimo?: number;
}

export const catalogApi = {
  getCategories: async () => {
    const { data } = await api.get<Category[]>('/categorias');
    return data;
  },

  getProducts: async (params?: { search?: string; categoryId?: string; page?: number; limit?: number }) => {
    // O backend aceita search=, que mapeia para nome, SKU e código de barras.
    //
    // A resposta vem como `{ data, meta: { total, page, limit, totalPages } }`, mas o
    // tipo declarado aqui dizia `{ data, total }` — pelo que `total` era sempre
    // `undefined` e a paginação da listagem ficava presa em "página 1 de 1", com o
    // botão "Próxima" permanentemente desactivado. Normaliza-se aqui, que é onde o
    // contrato com o backend pertence, em vez de cada ecrã ir buscar a `meta`.
    const { data } = await api.get<{
      data: Product[];
      meta?: { total: number; page: number; limit: number; totalPages: number };
      total?: number;
    }>('/produtos', { params });

    return {
      data: data.data,
      total: data.meta?.total ?? data.total ?? 0,
      totalPages: data.meta?.totalPages ?? 1,
    };
  },

  updateProduct: async (id: string, productData: Partial<Product>) => {
    const { data } = await api.patch<Product>(`/produtos/${id}`, productData);
    return data;
  },

  createProduct: async (productData: CreateProductPayload) => {
    const { data } = await api.post<Product>('/produtos', productData);
    return data;
  },

  deleteProduct: async (id: string) => {
    const { data } = await api.delete(`/produtos/${id}`);
    return data;
  }
};
