import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogApi, type CreateProductPayload } from '../api/catalog.api';
import toast from 'react-hot-toast';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogApi.getCategories(),
  });
}

export function useProducts(params?: { search?: string; categoryId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => catalogApi.getProducts(params),
    placeholderData: (prev) => prev,
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => catalogApi.updateProduct(id, data),
    onSuccess: () => {
      toast.success('Produto atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        toast.error('Não tem permissão para atualizar produtos.');
      } else {
        toast.error(error.response?.data?.message || 'Erro ao atualizar produto.');
      }
    }
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductPayload) => catalogApi.createProduct(data),
    onSuccess: (_produto, variaveis) => {
      const comStock = (variaveis.quantidadeInicial ?? 0) > 0;

      toast.success(
        comStock
          ? `Produto criado com ${variaveis.quantidadeInicial} unidades em stock.`
          : 'Produto criado com sucesso!',
      );

      queryClient.invalidateQueries({ queryKey: ['products'] });

      // A criação abre posições de stock em todos os armazéns (e dá entrada num deles,
      // se pedido), pelo que o separador dos saldos ao lado ficaria desactualizado.
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      if (comStock) {
        queryClient.invalidateQueries({ queryKey: ['all-stock-movements'] });
      }
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        toast.error('Não tem permissão para criar produtos.');
      } else {
        toast.error(error.response?.data?.message || 'Erro ao criar produto.');
      }
    }
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => catalogApi.deleteProduct(id),
    onSuccess: () => {
      toast.success('Produto eliminado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        toast.error('Não tem permissão para eliminar produtos.');
      } else {
        toast.error(error.response?.data?.message || 'Erro ao eliminar produto.');
      }
    }
  });
}
