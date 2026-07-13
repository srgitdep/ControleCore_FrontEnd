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
      toast.error(error.response?.data?.message || 'Erro ao atualizar produto.');
    }
  });
}
