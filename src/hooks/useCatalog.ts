import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogApi } from '@/api/catalog.api';
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
    mutationFn: (data: any) => catalogApi.createProduct(data),
    onSuccess: () => {
      toast.success('Produto criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
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
