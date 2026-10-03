import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogApi, type CreateProductPayload } from '../api/catalog.api';
import toast from 'react-hot-toast';
import i18n from '@/i18n';

// Fora de componentes não há hook: `getFixedT` com língua nula segue a língua activa em cada
// chamada, e não a do momento em que o módulo carregou.
const t = i18n.getFixedT(null, 'produtos');

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
      toast.success(t('mensagens.produto_actualizado'));
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        toast.error(t('mensagens.sem_permissao_actualizar'));
      } else {
        toast.error(error.response?.data?.message || t('mensagens.erro_actualizar'));
      }
    }
  });
}

export function useCarregarImagemProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ produtoId, ficheiro }: { produtoId: string; ficheiro: File }) =>
      catalogApi.carregarImagemProduto(produtoId, ficheiro),
    onSuccess: () => {
      toast.success(t('mensagens.imagem_carregada'));
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['produto-detalhe'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('mensagens.erro_carregar_imagem'));
    },
  });
}

export function useRemoverImagemProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ produtoId, imagemId }: { produtoId: string; imagemId: string }) =>
      catalogApi.removerImagemProduto(produtoId, imagemId),
    onSuccess: () => {
      toast.success(t('mensagens.imagem_removida'));
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['produto-detalhe'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('mensagens.erro_remover_imagem'));
    },
  });
}

export function useDefinirImagemPrincipal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ produtoId, imagemId }: { produtoId: string; imagemId: string }) =>
      catalogApi.definirImagemPrincipal(produtoId, imagemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['produto-detalhe'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('mensagens.erro_carregar_imagem'));
    },
  });
}

export function useReordenarImagensProduto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ produtoId, imagemIds }: { produtoId: string; imagemIds: string[] }) =>
      catalogApi.reordenarImagensProduto(produtoId, imagemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['produto-detalhe'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('mensagens.erro_carregar_imagem'));
    },
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
          ? t('mensagens.produto_criado_stock', { count: variaveis.quantidadeInicial })
          : t('mensagens.produto_criado'),
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
        toast.error(t('mensagens.sem_permissao_criar'));
      } else {
        toast.error(error.response?.data?.message || t('mensagens.erro_criar'));
      }
    }
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: catalogApi.createCategory,
    onSuccess: () => {
      toast.success(t('mensagens.categoria_criada'));
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('mensagens.erro_criar_categoria'));
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Parameters<typeof catalogApi.updateCategory>[1] }) =>
      catalogApi.updateCategory(id, dto),
    onSuccess: () => {
      toast.success(t('mensagens.categoria_actualizada'));
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('mensagens.erro_actualizar_categoria'));
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: catalogApi.deleteCategory,
    onSuccess: () => {
      toast.success(t('mensagens.categoria_apagada'));
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('mensagens.erro_apagar_categoria'));
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => catalogApi.deleteProduct(id),
    onSuccess: () => {
      toast.success(t('mensagens.produto_eliminado'));
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        toast.error(t('mensagens.sem_permissao_eliminar'));
      } else {
        toast.error(error.response?.data?.message || t('mensagens.erro_eliminar'));
      }
    }
  });
}
