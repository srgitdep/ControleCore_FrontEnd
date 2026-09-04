import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listarClientes,
  obterCliente,
  criarCliente,
  atualizarCliente,
  apagarCliente,
  buscarClientesCRM,
  obterHistoricoCompras
} from '../api/clientes.api';
import toast from 'react-hot-toast';

export function useClientes(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['clientes', params],
    queryFn: () => listarClientes(params || {}),
    placeholderData: (prev) => prev,
  });
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: () => obterCliente(id),
    enabled: !!id,
  });
}

/**
 * O histórico completo de compras, para quando as dez da ficha não bastam.
 *
 * `enabled` mantém-no em espera até alguém o pedir: um cliente com centenas de compras
 * traria todas as linhas de todas as vendas, e a ficha abre-se muitas vezes só para ver o
 * contacto.
 */
export function useHistoricoCliente(id: string, enabled = false) {
  return useQuery({
    queryKey: ['cliente-historico', id],
    queryFn: () => obterHistoricoCompras(id),
    enabled: !!id && enabled,
  });
}

export function useSearchClientes(search: string) {
  return useQuery({
    queryKey: ['clientes-search', search],
    queryFn: () => buscarClientesCRM(search),
    enabled: search.length >= 2,
    staleTime: 1000 * 60, // 1 minuto
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: criarCliente,
    onSuccess: () => {
      toast.success('Cliente registado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-search'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao registar cliente.');
    }
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => atualizarCliente(id, data),
    onSuccess: (_, variables) => {
      toast.success('Cliente atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['clientes-search'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar cliente.');
    }
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apagarCliente,
    onSuccess: () => {
      toast.success('Cliente eliminado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-search'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao eliminar cliente.');
    }
  });
}
