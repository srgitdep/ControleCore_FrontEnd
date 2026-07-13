import { api } from './axios';
import type { Product, Category } from '@/types/catalog.types';

export const catalogApi = {
  getCategories: async () => {
    const { data } = await api.get<Category[]>('/categorias');
    return data;
  },

  getProducts: async (params?: { search?: string; categoryId?: string; page?: number; limit?: number }) => {
    // Retornando array de produtos (ou paginado dependendo de como o backend faz para o POS).
    // O backend aceita search= que mapeia para nome, SKU, codigoBarras.
    const { data } = await api.get<{ data: Product[], total: number }>('/produtos', { params });
    return data;
  },

  updateProduct: async (id: string, productData: Partial<Product>) => {
    const { data } = await api.put<Product>(`/produtos/${id}`, productData);
    return data;
  }
};
